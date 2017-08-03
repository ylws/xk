import {LocalVideo} from './xk.babel.min.js'
export default {
 	install: function(Vue) {
	 Object.defineProperty(Vue.prototype, '$XK', { value: LocalVideo });
  }
}