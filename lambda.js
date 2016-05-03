function ast(o,l,r){
	return {o:o, l:l, r:r};
}

function parse(ex, env){
	env = env || new Env();

	var terms = [], temp;
	for(var i = 0; i < ex.length;){
		if(temp = ex[i].match(/\s+/))
			i += temp[0].length;
		else if(ex[i] == '('){
			temp = i;
			var lv = 1;
			while(++i < ex.length && lv > 0)
				if(ex[i] == '(') lv++;
				else if(ex[i] == ')') lv--;
			if(lv > 0) throw "Parse Error: Unmatched (";
			terms.push(parse(ex.slice(temp+1, i-1), env))
		}else if(ex[i] == 'l' || ex[i] == 'λ'){
			temp = ex.slice(++i).match(/^(\w+)\.(.+)/);
			if(!temp) throw "Parse Error: Bad lambda";
			terms.push(ast( 'l',  temp[1],  parse(temp[2], env.add(temp[1], temp[1]))));
			i += temp[0].length;
			break;
		}else if(temp = ex.slice(i).match(/^[a-zA-z0-9]+/)){
			var def = env.get(temp[0]);
			if(def === undefined)
				def = temp[0];
			terms.push(def);
			i += temp[0].length;
		}else throw "Parse Error: Unregonized expression";
	}

	if(terms.length == 0) throw "Parse Error: Empty term";

	var tree = terms[0];
	for(i = 1; i < terms.length; i++)
		tree = ast('@', tree, terms[i]);
	return tree;
}
function format(tree){
	if(tree.o === undefined) return tree;
	else if(tree.o == '@'){
		var l = format(tree.l), r = format(tree.r), lv = 0;

		if(tree.r.o == '@') r = '(' + r + ')';
		else r = ' ' + r;

		for(var i = l.length-1; i >= 0; i--)
			if(l[i] == ')') lv++;
			else if(l[i] == '(') lv--;
			else if(l[i] == 'λ' && lv == 0) return '(' + l + ')' + r;
		return l + r;
	}else if(tree.o == 'l') return 'λ' + tree.l + '.' + format(tree.r);
}
function render(tree){
	var span = $('<span>').addClass('lambda lambda-term');
	if(tree.o === undefined) return span.addClass('lambda-variable').text(tree);

	var left = render(tree.l), right = render(tree.r);
	if(tree.o == 'l'){
		span.addClass('lambda-abstraction').append(
			$('<span>').addClass('lambda lambda-lambda').text('λ'),
			left.addClass('lambda-capture').removeClass('lambda-term'),
			$('<span>').addClass('lambda lambda-dot').text('.'),
			right.addClass('lambda-body')
		);
		return span;
	}else if(tree.o == '@'){
		if(tree.l.o == 'l' || tree.l.r !== undefined && tree.l.r.o == 'l')
			left.prepend($('<span>').addClass('lambda lambda-lpar').text('('))
				.append($('<span>').addClass('lambda lambda-rpar').text(')'));
		span.append(left);

		if(tree.r.o == '@')
			right.prepend($('<span>').addClass('lambda lambda-lpar').text('('))
				.append($('<span>').addClass('lambda lambda-rpar').text(')'));
		else
			span.append($('<span>').addClass('lambda lambda-space').html('&nbsp;'));
		span.append(right);

		if(isredex(tree)) span.addClass('lambda-redex');
		return span;
	}
}

function subtree(tree, path){
	for(var i = 0; i < path.length; i++){
		if(tree === undefined) throw "Path Error: No such subtree";
		if(path[i] == 'l') tree = tree.l;
		else if(path[i] == 'r') tree = tree.r;
		else throw "Path Error: Invalid path";
	}
	return tree;
}

function ren(tree, v, u){
	if(tree.o === undefined)
		return tree==v ? u : tree;
	else
		return ast(tree.o, ren(tree.l,v,u), ren(tree.r,v,u));
}
function alpha(tree, path, u){
	if(tree === undefined) throw "Path error: No such subtree";
	if(path == ''){
		if(tree.o != 'l') throw "Alpha error: Not lambda abstraction";
		return ast('l', u, ren(tree.r, tree.l, u));
	}
	if(path[0] == 'l') return ast(tree.o, alpha(tree.l, path.slice(1), u), tree.r);
	if(path[0] == 'r') return ast(tree.o, tree.l, alpha(tree.r, path.slice(1), u));
	throw "Path error: Invalid path";
}

function vars(tree){
	if(tree.o === undefined) return [tree];
	if(tree.o == 'l')
		return $.grep(vars(tree.r), function(e){ return e!=tree.l; });
	return vars(tree.l).concat(vars(tree.r));
}
function isredex(tree){ return tree.o == '@' && tree.l.o == 'l'; }
function subst(tree, v, t){
	if(tree.o === undefined)
		return tree==v ? t : tree;
	if(tree.o === 'l')
		if(tree.l == v) return tree;
		else{
			if($.inArray(tree.l, vars(t)) != -1)
				tree = alpha(tree, '', tree.l+"'");
			return ast('l', tree.l, subst(tree.r, v, t));
		}
	return ast(tree.o, subst(tree.l, v, t), subst(tree.r, v, t));
}
function beta(tree, path){
	if(tree === undefined) throw "Path error: No such subtree";
	if(path == ''){
		if(!isredex(tree)) throw "Beta error: Not beta-redex";
		return subst(tree.l.r, tree.l.l, tree.r);
	}
	if(path[0] == 'l') return ast(tree.o, beta(tree.l, path.slice(1)), tree.r);
	if(path[0] == 'r') return ast(tree.o, tree.l, beta(tree.r, path.slice(1)));
	throw "Path error: Invalid path";
}

function findredex(tree){
	if(isredex(tree)) return '';
	if(tree.o === undefined) return false;

	var temp = findredex(tree.l);
	if(temp !== false) return 'l' + temp;

	temp = findredex(tree.r);
	if(temp !== false) return 'r' + temp;

	return false;
}
function step(tree){
	var path = findredex(tree);
	if(path !== false) return beta(tree, path);
	return null;
}
function norm(tree){
	var temp;
	while((temp = step(tree)) !== null)
		tree = temp;
	return tree;
}