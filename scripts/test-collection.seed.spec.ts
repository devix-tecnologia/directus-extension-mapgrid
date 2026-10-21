import { it } from 'vitest';
import { globalSetup } from '../tests/e2e/global-setup';
import { ensureLprCollection, ensureLprMapGrid } from '../tests/helpers/lpr-collection';
import { ensurePersonTrack, ensurePersonTrackMapGrid } from '../tests/helpers/person-track';

it('seeds the test collection and the MapGrid preset', async () => {
  await globalSetup();
  await ensurePersonTrack();
  await ensurePersonTrackMapGrid();
  await ensureLprCollection();
  await ensureLprMapGrid();
});
