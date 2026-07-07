const states = new Map();
function setState(userId, state) { states.set(String(userId), state); }
function getState(userId) { return states.get(String(userId)); }
function clearState(userId) { states.delete(String(userId)); }
module.exports = { setState, getState, clearState };
