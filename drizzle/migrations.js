// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_futuristic_ego.sql';
import m0001 from './0001_large_bloodstorm.sql';
import m0002 from './0002_bitter_masque.sql';
import m0003 from './0003_fine_genesis.sql';
import m0004 from './0004_public_surge.sql';
import m0005 from './0005_silly_mulholland_black.sql';
import m0006 from './0006_messy_talisman.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  