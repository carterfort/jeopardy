import Vue from 'vue';
import Game from './components/Game.vue';

var VueResource = require('vue-resource');
Vue.use(VueResource);

new Vue({
  el: 'body',
  components: { Game }
});