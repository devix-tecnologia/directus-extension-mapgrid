<template>
  <div class="table-container" ref="tableContainer">
    <v-table
      v-if="items && items.length > 0"
      v-model="selectedItems"
      :headers="resolvedHeaders"
      :items="items"
      :show-select="true"
      :show-resize="true"
      :can-delete="canDelete"
      :sort="tableSort"
      fixed-header
      allow-header-reorder
      @click:row="handleRowClick"
      @update:headers="handleHeaderReorder"
      @update:sort="handleTableSort"
    >
      <template #[`item.actions`]="{ item }">
        <div class="actions">
          <v-icon
            v-if="canEdit"
            v-tooltip="t('editItem')"
            class="action-icon"
            name="edit"
            small
            clickable
            @click.stop="emit('edit-item', item)"
          />
        </div>
      </template>

      <!--
        A escolha de colunas vive no cabecalho, e nao no painel lateral, porque e
        onde o layout tabular do Directus a coloca: um `+` abre a lista de campos
        e o menu de contexto de cada coluna oferece remover.
      -->
      <template #header-append>
        <v-menu placement="bottom-start" show-arrow :close-on-content-click="false">
          <template #activator="{ toggle, active }">
            <v-icon
              v-tooltip="t('optionColumnsAdd')"
              class="add-field"
              name="add"
              clickable
              :class="{ active }"
              @click="toggle"
            />
          </template>
          <v-field-list :collection="collection" :disabled-fields="shownFields" @add="addField" />
        </v-menu>
      </template>

      <template #header-context-menu="{ header }">
        <v-list>
          <template v-if="header.value !== ACTIONS_COLUMN">
            <v-list-item
              clickable
              :active="tableSort.by === header.value && !tableSort.desc"
              :data-sort-asc="header.value"
              @click="applySort(header.value, false)"
            >
              <v-icon name="sort" small />
              {{ t('sortAscending') }}
            </v-list-item>

            <v-list-item
              clickable
              :active="tableSort.by === header.value && tableSort.desc"
              :data-sort-desc="header.value"
              @click="applySort(header.value, true)"
            >
              <v-icon name="sort" small />
              {{ t('sortDescending') }}
            </v-list-item>

            <v-divider />

            <v-list-item
              clickable
              :data-remove-field="header.value"
              @click="removeField(header.value)"
            >
              <v-icon name="remove" small />
              {{ t('hideField') }}
            </v-list-item>
          </template>
        </v-list>
      </template>

      <template v-for="header in headers" :key="header.value" #[`item.${header.value}`]="{ item }">
        <span :class="{ 'selected-row': selectedItemId === item.id }">
          <ValueCell :value="item[header.value]" />
        </span>
      </template>
    </v-table>

    <v-info v-else icon="search" :title="t('noItems')" center />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fromTableSort, type GeoItem, type TableSort, toTableSort } from '../../../contract/index';
import type { ResolvedHeader } from '../../../services/table/index';
import { MESSAGES } from '../../../shared/messages';
import { ValueCell } from '../../atoms/value-cell/index';
import type { TableComponentEmits, TableComponentProps } from './TableComponent.types';

const props = withDefaults(defineProps<TableComponentProps>(), {
  canEdit: true,
  canDelete: true,
});

const emit = defineEmits<TableComponentEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const selectedItemId = ref<string | number | null>(null);
const tableContainer = ref<HTMLDivElement | null>(null);
const SCROLL_DELAY_MS = 50;

const selectedItems = computed({
  get: () => props.selectedItems,
  set: (value: GeoItem[]) => emit('update:selectedItems', value),
});

/*
 * A ordenacao, nos dois formatos. O preset guarda `['-name']`; o `v-table` fala
 * `{ by, desc }`. E o clique no cabecalho nao ordena mais: assim que o slot
 * `header-context-menu` existe, o `v-table` troca esse clique por abrir o menu
 * — e por isso ordenar mora dentro do menu, como no layout tabular do Directus.
 */
const tableSort = computed<TableSort>(() => toTableSort(props.sort));

const applySort = (field: string, desc: boolean): void => {
  emit('update:sort', fromTableSort({ by: field, desc }));
};

const handleTableSort = (next: TableSort): void => {
  emit('update:sort', fromTableSort(next));
};

/** A coluna de acoes nao vem da colecao, entao nunca entra no que se grava. */
const ACTIONS_COLUMN = 'actions';

const resolvedHeaders = computed<ResolvedHeader[]>(() => [
  ...props.headers.map(
    (header): ResolvedHeader => ({
      text: header.text,
      value: header.value,
      sortable: true,
      width: null,
    })
  ),
  { text: t('actionsColumn'), value: ACTIONS_COLUMN, sortable: false, width: 100, align: 'right' },
]);

/** As colunas mostradas hoje, na ordem, sem a de acoes. */
const shownFields = computed<string[]>(() => props.headers.map((header) => header.value));

/**
 * `v-field-list` devolve as chaves que coletou. Acrescentar uma que ja esta la
 * desenharia a mesma coluna duas vezes, entao repeticao e ignorada — o seletor
 * ja as deixa esmaecidas por `disabled-fields`, e isto cobre o caso em que nao
 * deixa.
 */
const addField = (added: string[] | string): void => {
  const keys = Array.isArray(added) ? added : [added];
  const fresh = keys.filter((key) => key !== '' && !shownFields.value.includes(key));
  if (fresh.length === 0) return;

  emit('update:fields', [...shownFields.value, ...fresh]);
};

const removeField = (field: string): void => {
  emit(
    'update:fields',
    shownFields.value.filter((candidate) => candidate !== field)
  );
};

/**
 * Arrastar um cabecalho reordena as colunas. A ordem nova nao mora no `v-table`:
 * ela volta como a ordem dos campos escolhidos, que e onde o preset a guarda.
 * A coluna de acoes nao e um campo da colecao, entao sai do que se grava.
 */
const handleHeaderReorder = (reordered: ResolvedHeader[]): void => {
  const fields = reordered
    .map((header) => header.value)
    .filter((value) => value !== ACTIONS_COLUMN);

  emit('update:fields', fields);
};

const handleRowClick = ({ item }: { item: GeoItem }): void => {
  emit('focus-on-item', item);
  selectedItemId.value = item.id;
};

/**
 * Scrolls the grid to the item's row and highlights it. The delay waits for
 * v-table to finish drawing the row: without it querySelector runs before the
 * row exists and the scroll never happens.
 */
const selectItem = (id: string | number): void => {
  selectedItemId.value = id;

  nextTick(() => {
    setTimeout(() => {
      if (!tableContainer.value) return;

      const row = tableContainer.value.querySelector<HTMLElement>(
        `[data-id="${CSS.escape(String(id))}"]`
      );
      if (!row) return;

      const container = tableContainer.value;
      const scrollOffset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;

      container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    }, SCROLL_DELAY_MS);
  });
};

defineExpose({ selectItem });
</script>

<style scoped>
/* O `+` do cabecalho, no mesmo lugar em que o layout tabular do Directus o põe. */
.add-field {
  margin-inline-start: 8px;
}

.add-field.active {
  --v-icon-color: var(--theme--primary);
}

.table-container {
  overflow-y: auto;
  position: relative;
}

.table-container :deep(.v-table) {
  --v-table-background-color: transparent;
  --v-table-header-background-color: var(--theme--background-subdued);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--form-horizontal-gap);
  padding: 0 var(--form-horizontal-gap);
}

.action-icon {
  opacity: 0;
  transition: color var(--transition-fast) var(--transition), opacity var(--transition-fast) var(--transition);
  --v-icon-color: var(--theme--foreground-subdued);
  --v-icon-color-hover: var(--theme--primary);
}

.table-container :deep(tr:hover) .action-icon,
.table-container :deep(tr:focus-within) .action-icon,
.table-container .actions:hover .action-icon {
  opacity: 1;
}

.table-container :deep(tr:has(.selected-row)) {
  background-color: var(--theme--primary-background) !important;
}

.selected-row {
  font-weight: 600;
  color: var(--theme--primary);
}

.table-container::-webkit-scrollbar {
  width: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: var(--theme--background-subdued);
  border-radius: var(--theme--border-radius);
}

.table-container::-webkit-scrollbar-thumb {
  background: var(--theme--foreground-subdued);
  border-radius: var(--theme--border-radius);
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: var(--theme--foreground);
}
</style>
