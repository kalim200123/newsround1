export const FAVICON_URLS: Record<string, string> = {
  'yna.co.kr': 'https://www.google.com/s2/favicons?domain=yna.co.kr&sz=32',
  'hani.co.kr': 'https://www.google.com/s2/favicons?domain=hani.co.kr&sz=32',
  'khan.co.kr': 'https://www.google.com/s2/favicons?domain=khan.co.kr&sz=32',
  'ohmynews.com':
    'https://www.google.com/s2/favicons?domain=ohmynews.com&sz=32',
  'chosun.com': 'https://www.google.com/s2/favicons?domain=chosun.com&sz=32',
  'joongang.co.kr':
    'https://www.google.com/s2/favicons?domain=joongang.co.kr&sz=32',
  'donga.com': 'https://www.google.com/s2/favicons?domain=donga.com&sz=32',
  'newsis.com': 'https://www.google.com/s2/favicons?domain=newsis.com&sz=32',
};

export type ArticleRow = Record<string, any>;

export function processArticles(rows: ArticleRow[]) {
  return rows.map((article) => ({
    ...article,
    favicon_url: FAVICON_URLS[article.source_domain] || null,
  }));
}
