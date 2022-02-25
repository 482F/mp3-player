import { createStore } from 'vuex'

const state = {
  info: {},
}

const mutations = {
  setInfo(state, info) {
    state.info = info
  },
}

const actions = {
  setInfo: ({ commit }, value) => commit('setInfo', value),
}

export default createStore({
  state,
  actions,
  mutations,
})
