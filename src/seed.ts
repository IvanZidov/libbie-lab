import { all } from "./repository";
console.log(
  `Seed ready: ${all("scenario").length} scenarios, ${all("property").length} workspace listings (14 total including exclusion fixture).`,
);
