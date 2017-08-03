import {CFCMXK} from './src/xk.babel.min.js'
export default {
 	install: function(Vue) {
	 Object.defineProperty(Vue.prototype, '$CFCMXK', { value: CFCMXK });
  }
}