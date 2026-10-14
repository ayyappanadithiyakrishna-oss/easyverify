import {section2Target, addBusinessDays} from '../support/dates.mjs';
export const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
export const RULESET_VERSION = '2026-10-13.1';
export function validateProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter a business profile.');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 80) throw new Error('Business name must be between 1 and 80 characters.');
  if (!STATES.includes(input.state)) throw new Error('Choose a supported US state or DC.');
  if (!Number.isInteger(input.headcount) || input.headcount < 1 || input.headcount > 1000000) throw new Error('Employee count must be a whole number from 1 to 1,000,000.');
  if (!['yes','no','unknown'].includes(input.participation) || !['yes','no','unknown'].includes(input.far)) throw new Error('Choose an E-Verify and contract-clause answer.');
  if (typeof input.shortJob !== 'boolean') throw new Error('Choose whether the job lasts fewer than three days.');
  if (!['weekdays','sixDays','everyDay'].includes(input.calendar)) throw new Error('Choose a working calendar.');
  if (typeof input.hireDate !== 'string' || input.hireDate < '2000-01-01' || input.hireDate > '2099-12-31') throw new Error('Hire date must be between 2000 and 2099.');
  const workingDays = input.calendar === 'everyDay' ? [0,1,2,3,4,5,6] : input.calendar === 'sixDays' ? [1,2,3,4,5,6] : [1,2,3,4,5];
  if (!Array.isArray(input.closures) || input.closures.length > 50) throw new Error('Enter at most 50 closure dates.');
  addBusinessDays(input.hireDate,0,{workingDays, closures:input.closures});
  // Zero-day arithmetic validates every supplied closure as well as the hire date.
  return {name,state:input.state,headcount:input.headcount,participation:input.participation,far:input.far,hireDate:input.hireDate,shortJob:input.shortJob,calendar:input.calendar,closures:[...new Set(input.closures)].sort()};
}
export function evaluate(profile, rules, today = new Date().toISOString().slice(0,10)) {
  const p = validateProfile(profile);
  const calendar = {workingDays:p.calendar === 'everyDay' ? [0,1,2,3,4,5,6] : p.calendar === 'sixDays' ? [1,2,3,4,5,6] : [1,2,3,4,5], closures:p.closures};
  const predicates = {always:true, participantNonContractor:p.participation === 'yes' && p.far === 'no', contractor:p.far === 'yes', contractUnknown:p.far === 'unknown', participationUnknown:p.participation === 'unknown', california:p.state === 'CA',otherState:p.state !== 'CA'};
  return rules.map(rule => {
    const matched = predicates[rule.when] === true;
    const stale = rule.reviewed && today > addBusinessDays(rule.reviewed,90,{workingDays:[0,1,2,3,4,5,6]});
    let due = null;
    if (matched && rule.mode === 'task' && !stale) {
      if (rule.deadline === 'hire') due = p.hireDate;
      if (rule.deadline === 'section2') due = section2Target(p.hireDate,{jobLastsLessThanThreeDays:p.shortJob,...calendar});
      if (rule.deadline === 'case') due = addBusinessDays(p.hireDate,3,calendar);
    }
    return {...rule,matched,due,needsReview:matched && (rule.mode === 'review' || !rule.reviewed || Boolean(stale)),stale:Boolean(stale),trace:[`State: ${p.state}`,`Employees: ${p.headcount} (context only; not used as a federal threshold)`,`E-Verify participation: ${p.participation}`,`FAR E-Verify clause: ${p.far}`,`Rule condition: ${rule.when}`,`Result: ${matched ? 'Matched' : 'Not matched'}`]};
  });
}
export function taskStatus(rule, completed, today) {
  if (rule.needsReview) return 'Needs review';
  if (completed) return 'Complete';
  if (!rule.due) return 'Open';
  if (rule.due < today) return 'Past target';
  if (rule.due === today) return 'Due today';
  return 'Upcoming';
}
