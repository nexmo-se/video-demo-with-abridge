class State {
    static _instance;
    static getInstance() {
      if (State._instance == null) {
        State._instance = new State();
      }
      return State._instance;
    }
    constructor() {
      this.data = new Map();
    }
}
module.exports = State;
