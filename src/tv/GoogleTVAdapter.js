import { AndroidTVAdapter } from './AndroidTVAdapter.js';

export class GoogleTVAdapter extends AndroidTVAdapter {
  static get brand() { return 'Google TV'; }
  static get discoveryMethod() { return 'mDNS (_androidtvremote2._tcp)'; }
}
