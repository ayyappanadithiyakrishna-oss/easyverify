// AI-assisted support module. Student team owns legal interpretation and integration.
// Dates are civil dates in UTC, preventing local daylight-saving changes.
function parse(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError('Use YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new RangeError('Invalid calendar date');
  return date;
}
const format = date => date.toISOString().slice(0, 10);
/** @param {string} start @param {number} count @param {{workingDays?: number[], closures?: string[]}} options */
export function addBusinessDays(start, count, {workingDays = [1,2,3,4,5], closures = []} = {}) {
  const date = parse(start);
  if (!Number.isInteger(count) || count < 0 || count > 3660) throw new RangeError('Invalid day count');
  if (!Array.isArray(workingDays) || !workingDays.length || workingDays.some(d => !Number.isInteger(d) || d < 0 || d > 6))
    throw new RangeError('Select at least one valid working weekday');
  if (!Array.isArray(closures)) throw new TypeError('Closures must be an array');
  const closed = new Set(closures.map(d => format(parse(d))));
  let remaining = count;
  while (remaining) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (workingDays.includes(date.getUTCDay()) && !closed.has(format(date))) remaining--;
  }
  return format(date);
}
/** @param {string} hireDate @param {{jobLastsLessThanThreeDays?: boolean, workingDays?: number[], closures?: string[]}} options */
export function section2Target(hireDate, {jobLastsLessThanThreeDays = false, ...calendar} = {}) {
  parse(hireDate);
  if (typeof jobLastsLessThanThreeDays !== 'boolean') throw new TypeError('Short-job flag must be boolean');
  return jobLastsLessThanThreeDays ? hireDate : addBusinessDays(hireDate, 3, calendar);
}
