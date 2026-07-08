const states = new Map();

function setState(userId, state, payload = {}) {
  states.set(String(userId), { state, payload });
}

function getState(userId) {
  return states.get(String(userId));
}

function clearState(userId) {
  states.delete(String(userId));
}

module.exports = {
  setState,
  getState,
  clearState
};
