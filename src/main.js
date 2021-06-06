import dotEnv from 'dotenv';
dotEnv.config();
import CmcModule from './modules/cmc-module/cmc.module';
import CgModule from './modules/cg-module/cg.module';

export default function bootstrap() {
  const cmcModule = new CmcModule();
  const cgModule = new CgModule();

  setTimeout(() => {
    cmcModule.start();
    cgModule.start();
  }, 5000);
}
