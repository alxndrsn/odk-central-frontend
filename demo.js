import { fakePastDate } from './test/util/date-time.js';

function afterEach() {}

for(let i=0; i<1; ++i) {
  fakePastDate([
    new Date().toISOString(),
  ]);
}
