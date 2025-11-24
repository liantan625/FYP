import { NativeModules, Platform } from 'react-native';

const { PlayIntegrity } = NativeModules;

export interface PlayIntegrityAPI {
  requestIntegrityToken(nonce: string): Promise<string>;
}

const PlayIntegrityModule: PlayIntegrityAPI = {
  requestIntegrityToken: async (nonce: string): Promise<string> => {
    if (Platform.OS !== 'android') {
      throw new Error('Play Integrity API is only available on Android');
    }
    
    if (!PlayIntegrity) {
      throw new Error('PlayIntegrity module is not available');
    }

    return PlayIntegrity.requestIntegrityToken(nonce);
  },
};

export default PlayIntegrityModule;
