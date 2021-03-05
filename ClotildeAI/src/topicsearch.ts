import wikipedia from "wikipedia";

export default async (topic: string) => {
  const search = await wikipedia.search(topic);
  const page = await wikipedia.page(search.results[0].title);

  const summary = await page.summary();

  return summary.extract;
};
