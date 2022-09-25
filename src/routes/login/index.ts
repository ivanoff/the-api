import routes from './routes';
import errors from './errors';
import limits from './limits';
import c from './controller';

const setEmailTemplates = c.setEmailTemplates;
const addFieldsToToken = c.addFieldsToToken;

export default routes;

export { errors, limits, setEmailTemplates, addFieldsToToken };
