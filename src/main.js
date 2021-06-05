import CmcModule from './modules/cmc-module/cmc.module';

export default function bootstrap() {
  const cmcModule = new CmcModule();

  cmcModule.start();
}
