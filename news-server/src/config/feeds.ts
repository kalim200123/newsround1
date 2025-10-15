export interface Feed {
  source: string;
  source_domain: string;
  side: "LEFT" | "RIGHT";
  url: string;
  section: string;
}

export const FEEDS: Feed[] = [
  /* LEFT
    { source: "경향신문", source_domain: "khan.co.kr", side: "LEFT", url: "https://www.khan.co.kr/rss/rssdata/politic_news.xml", section: "정치" },
    { source: "경향신문", source_domain: "khan.co.kr", side: "LEFT", url: "https://www.khan.co.kr/rss/rssdata/economy_news.xml", section: "경제" },
    { source: "경향신문", source_domain: "khan.co.kr", side: "LEFT", url: "https://www.khan.co.kr/rss/rssdata/society_news.xml", section: "사회" },
    { source: "경향신문", source_domain: "khan.co.kr", side: "LEFT", url: "https://www.khan.co.kr/rss/rssdata/culture_news.xml", section: "문화" },
    { source: "한겨레", source_domain: "hani.co.kr", side: "LEFT", url: "https://www.hani.co.kr/rss/politics/", section: "정치" },
    { source: "한겨레", source_domain: "hani.co.kr", side: "LEFT", url: "https://www.hani.co.kr/rss/economy/", section: "경제" },
    { source: "한겨레", source_domain: "hani.co.kr", side: "LEFT", url: "https://www.hani.co.kr/rss/society/", section: "사회" },
    { source: "한겨레", source_domain: "hani.co.kr", side: "LEFT", url: "https://www.hani.co.kr/rss/culture/", section: "문화" },
    { source: "오마이뉴스", source_domain: "ohmynews.com", side: "LEFT", url: "http://rss.ohmynews.com/rss/politics.xml", section: "정치" },
    { source: "오마이뉴스", source_domain: "ohmynews.com", side: "LEFT", url: "http://rss.ohmynews.com/rss/economy.xml", section: "경제" },
    { source: "오마이뉴스", source_domain: "ohmynews.com", side: "LEFT", url: "http://rss.ohmynews.com/rss/society.xml", section: "사회" },
    { source: "오마이뉴스", source_domain: "ohmynews.com", side: "LEFT", url: "http://rss.ohmynews.com/rss/culture.xml", section: "문화" },
    // RIGHT
    { source: "조선일보", source_domain: "chosun.com", side: "RIGHT", url: "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", section: "정치" },
    { source: "조선일보", source_domain: "chosun.com", side: "RIGHT", url: "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml", section: "경제" },
    { source: "조선일보", source_domain: "chosun.com", side: "RIGHT", url: "https://www.chosun.com/arc/outboundfeeds/rss/category/society/?outputType=xml", section: "사회" },
    { source: "조선일보", source_domain: "chosun.com", side: "RIGHT", url: "https://www.chosun.com/arc/outboundfeeds/rss/category/culture/?outputType=xml", section: "문화" },
    */ {
    source: "중앙일보",
    source_domain: "joongang.co.kr",
    side: "RIGHT",
    url: "https://news.google.com/rss/search?q=site:joongang.co.kr%20정치&hl=ko&gl=KR&ceid=KR%3Ako",
    section: "정치",
  },
  {
    source: "중앙일보",
    source_domain: "joongang.co.kr",
    side: "RIGHT",
    url: "https://news.google.com/rss/search?q=site:joongang.co.kr%20경제&hl=ko&gl=KR&ceid=KR%3Ako",
    section: "경제",
  },
  {
    source: "중앙일보",
    source_domain: "joongang.co.kr",
    side: "RIGHT",
    url: "https://news.google.com/rss/search?q=site:joongang.co.kr%20사회&hl=ko&gl=KR&ceid=KR%3Ako",
    section: "사회",
  },
  {
    source: "중앙일보",
    source_domain: "joongang.co.kr",
    side: "RIGHT",
    url: "https://news.google.com/rss/search?q=site:joongang.co.kr%20문화&hl=ko&gl=KR&ceid=KR%3Ako",
    section: "문화",
  },
  // {
  //   source: "동아일보",
  //   source_domain: "donga.com",
  //   side: "RIGHT",
  //   url: "https://rss.donga.com/politics.xml",
  //   section: "정치",
  // },
  // {
  //   source: "동아일보",
  //   source_domain: "donga.com",
  //   side: "RIGHT",
  //   url: "https://rss.donga.com/economy.xml",
  //   section: "경제",
  // },
  // {
  //   source: "동아일보",
  //   source_domain: "donga.com",
  //   side: "RIGHT",
  //   url: "https://rss.donga.com/national.xml",
  //   section: "사회",
  // },
  // {
  //   source: "동아일보",
  //   source_domain: "donga.com",
  //   side: "RIGHT",
  //   url: "https://rss.donga.com/culture.xml",
  //   section: "문화",
  // },
];
