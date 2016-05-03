function Env(obj){
	this._stack = [];
	this._last = {};

	if(obj === undefined) return;
	else if(obj instanceof Env){
		this._stack = obj._stack;
		this._last = obj._last;
	}else if(obj.constructor === Array)
		this._stack = obj;
	else if(obj.length !== undefined)
		this._stack = $.makeArray(obj);
	else if(typeof obj === 'function')
		this._stack.push(obj);
	else $.extend(this._last, obj);
}

Env.prototype.add = function(){
	var env = new Env(this);
	if(arguments.length == 2 && typeof arguments[0] === 'string'){
		env._last = $.extend({}, env._last);
		env._last[arguments[0]] = arguments[1];
		return env;
	}
	var args = Array.prototype.slice.call(arguments);
	while(args.length > 0){
		var arg = args.shift();
		if(arg instanceof Env)
			args = [arg._stack, arg._last].concat(args);
		else if(arg.length !== undefined){
			if(arg.length <= 0) continue;
			if(arg.constructor !== Array){
				arg = $.makeArray(arg);
				if(arg === false) throw "Env: Cannot add object"
			}
			if(!$.isEmptyObject(env._last)){
				env._stack = env._stack.concat((function(obj){
					return function(x){ return obj[x]; };
				})($.extend({}, env._last)));
				env._last = {};
			}
			env._stack = env._stack.concat(arg);
		}else if(typeof arg === 'function')
			env._stack = env._stack.concat([arg]);
		else
			env._last = $.extend({}, env._last, arg);
	}
	return env;
};

Env.prototype.get = function(x){
	var value = this._last[x];
	for(var i = this._stack.length-1; i >= 0 && value === undefined; i--)
		value = this._stack[i](x);
	return value;
};