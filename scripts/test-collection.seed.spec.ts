import { globalSetup } from '../tests/e2e/global-setup.ts';
import { ensurePersonTrack, ensurePersonTrackMapGrid } from '../tests/helpers/person-track.ts';

it('seeds the test collection and the MapGrid preset', async () => {
  await globalSetup();
  await ensurePersonTrack();
  await ensurePersonTrackMapGrid();
});
