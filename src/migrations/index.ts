import * as migration_20250726_113914_initial from './20250726_113914_initial';
import * as migration_20250812_234546 from './20250812_234546';

export const migrations = [
  {
    up: migration_20250726_113914_initial.up,
    down: migration_20250726_113914_initial.down,
    name: '20250726_113914_initial',
  },
  {
    up: migration_20250812_234546.up,
    down: migration_20250812_234546.down,
    name: '20250812_234546'
  },
];
