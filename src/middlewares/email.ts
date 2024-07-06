import { Routings } from 'the-api-routings';
import { Email } from '../Email';
import { EmailParamsType } from '../types';

const emailMiddleware = async (c: any, n: any) => {
  const email = new Email();

  c.env.email = ({ to, template, data, ...emailParams }: EmailParamsType) => {
    let { subject = '', text = '', html = '' } = { ...c.env.getTempplateByName(template), ...emailParams };

    if (!subject || (!text && !html))
      throw new Error('EMAIL_REQUIRES_FIELDS');

    if (!html) html = text;

    if (data) {
      subject = email.getPreparedData(subject, data);
      text = email.getPreparedData(text, data);
      html = email.getPreparedData(html, data);
    }

    email.send({ to, subject, text, html });
  }

  await n();
}

const emailRoute = new Routings();
emailRoute.use('*', emailMiddleware);
emailRoute.errors({
  EMAIL_REQUIRES_FIELDS: {
    code: 125,
    status: 400,
    description: 'Email requires both a subject and either text or HTML content',
  }
});

export { emailRoute as email };
