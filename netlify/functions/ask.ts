import { POST } from '../../app/api/ask/route';

export default async function handler(request: Request) {
  return POST(request);
}
