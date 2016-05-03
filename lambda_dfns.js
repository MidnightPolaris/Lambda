function dfns(){
	var dfn = {env: {}};

	dfn.common = {
		fix: "λf.(λx.f(x x)) λx.f(x x)",
		pair: "λx.λy.λf.f x y",
		true: "λt.λf.t",
		false: "λt.λf.f",
		and: "λa.λb.a b false",
		or: "λa.λb.a true b",
		not: "λb.b false true",
	};

	dfn.church = {
		S: "λn.λf.λa.f(n f a)",
		pred: "λn.λf.λa.((n λh.λg.g(h f)) λg.a) λx.x",
		add: "λm.λn.m S n",
		plus: "λm.λn.m S n",
		mult: "λm.λn.m(add n) 0",
		exp: "λm.λn.n m"
	};
	dfn.env.church = new Env(function(n){
		if(isNaN(n = parseInt(n))) return undefined;

		var b = "a";
		for(var i = 0; i < n; i++)
			b = "(f " + b + ")";
		return parse("lf.la." + b);
	}).add(function(x){
		var d = dfn.user[x] || dfn.common[x] || dfn.church[x];
		if(d !== undefined) d = parse(d, dfn.env.church);
		return d;
	});

	dfn.scott = {
		S: "λn.λf.λa.f n",
		pred: "λn.(n λp.p) 0",
		add: "fix λadd.λm.λn.(m λp.add p(S n)) n",
		plus: "fix λadd.λm.λn.(m λp.add p(S n)) n",
		mult: "fix λmult.λm.λn.(m λp.add n(mult p n)) 0",
		exp: "fix λexp.λm.λn.(n λp.mult m(exp m p)) 1"
	};
	dfn.env.scott = new Env(function(n){
		if(isNaN(n = parseInt(n))) return undefined;

		var b = "lf.la.a";
		for(var i = 0; i < n; i++)
			b = "lf.la.f " + b;
		return parse(b);
	}).add(function(x){
		var d = dfn.user[x] || dfn.common[x] || dfn.scott[x];
		if(d !== undefined) d = parse(d, dfn.env.scott);
		return d;
	});

	dfn.user = {};

	return dfn;
}