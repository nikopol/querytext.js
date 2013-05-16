/*
querytext.js 0.2 (c) 2012 niko
test if a text match a boolean query

supported query syntax:

  - AND (including + leading character)
  - OR  (including | character)
  - NOT (including leading ! or - charaters),
  - parenthesis
  - left and right truncatures (with * character)
  - quotes

constructors:

  querytext()          // get empty querytext object
  querytext("query")   // get querytext object with a parsed query
  querytext({          // get an object object with options:
    sensisitive: false,//   case sensitive (default=false)
    wholeword: true,   //   whole word only (default=true)
    unaccent: true,    //   accent unsensitive (default=true)
    matches: false,    //   want matched words with their position
    debug: false,      //   console debugging ouput (default=false)
    query: "query"     //   query string
  })

methods:

  parse('query');    //return {error:"msg",pos:12} or the 
                     //querytext object
  normalize();       //return the normalized query as string
  match('text');     //test if the text match the query
                     //  if matches flag is true  => return { word:[pos1,pos2], ... } or false
                     //  if matches flag is false => return true or false
  dump();            //return a string dump of the query tree
                     //(called after match, its include each
                     // nodes results)

usages:
	
  querytext('!!tata').match('toto TaTa TITI'); //return true
  querytext('--zaza').match('toto TaTa TITI'); //return true
  querytext('NOT NOT zaza').match('toto TaTa TITI');  //return true

  querytext('-tata').match('toto TaTa TITI'); //return false

  querytext('toto AND "TATA TITI"').match('toto TaTa TITI'); //return true
  querytext('toto +"TATA TITI"').match('toto TaTa TITI'); //return true

  var qt = querytext('toto AND (tata OR zizi)'); //return an object
  qt.match('toto TaTa TITI');  //return true
  console.log(qt.dump()); //output the following dump

  AND = true
   | "toto" = true
   | OR = true : (tata OR zizi)
   |  | "tata" = true
   |  | "zizi"

  querytext('toto tata').normalize() //return "toto" OR "tata"
  querytext('toto -tata titi').normalize() //return ("toto" AND NOT "tata") OR "titi"

  querytext({query:"T",matches:true,wholeword:false}).match("toto") //return {t:[0,2]}

=========================================================================
LICENSE
=========================================================================

DO WHAT THE FUCK YOU WANT WITH
ESPECIALLY IF YOU OFFER ME A BEER
PUBLIC LICENSE
Version 1, March 2012
 
Copyright (C) 2012 - niko
 
Everyone is permitted to copy and distribute verbatim 
or modified copies of this license document, and 
changing it is allowed as long as the name is changed.

DO WHAT THE FUCK YOU WANT TO PUBLIC
ESPECIALLY IF YOU OFFER ME A BEER LICENSE
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND 
MODIFICATION :
- You just DO WHAT THE FUCK YOU WANT.
- Especially if you offer me a beer.

*/

var querytext=(function(o){
	var
	unaccent = function(t){
		return t
			.replace(/Æ/gm,'AE')
			.replace(/[ÁÂÀÅÃÄ]/gm,'A')
			.replace(/Ç/gm,'C')
			.replace(/[ÉÊÈË]/gm,'E')
			.replace(/[ÍÎÌÏ]/gm,'I')
			.replace(/Ñ/gm,'N')
			.replace(/Œ/gm,'OE')
			.replace(/[ÓÔÒØÕÖ]/gm,'O')
			.replace(/[ÚÛÙÜ]/gm,'U')
			.replace(/Ý/gm,'Y')
			.replace(/æ/gm,'ae')
			.replace(/[áâàåãä]/gm,'a')
			.replace(/ç/gm,'c')
			.replace(/[éêèë]/gm,'e')
			.replace(/[íîìï]/gm,'i')
			.replace(/ñ/gm,'n')
			.replace(/œ/gm,'oe')
			.replace(/[óôòøõö]/gm,'o')
			.replace(/[úûùü]/gm,'u')
			.replace(/[ýÿ]/gm,'y')
	},
	qt = {
		VERSION: 0.3,
		opts: {
			dftbool: 'OR',
			sensitive: false,
			wholeword: true,
			unaccent: true,
			matches: false,
			debug: false
		},
		error: false,
		query: false,
		tree:  false,
		parse: function(q){
			var parse_branch = function(qry, offset, opts){
				//qry = qry.replace(/(^\s+|\s+$)/g,''); //trim
				if(!offset) offset = 0;
				var
					n = 0,
					not = false,
					mode = false,
					len = qry.length,
					o, op, q, t, p, root,
					add_branch = function(node,src){
						if(not){
							node.not = true;
							if(!mode) mode = 'AND';
							not = false;
						}
						if(node.text){
							var txt = node.text.replace(/(^\s+|\s+$)/gm,'');
							//set truncatures
							var ltrunc = (txt[0] == '*' || !opts.wholeword) ? '' : '(^|\\W:?)';
							var rtrunc = (txt.substr(-1) == '*' || !opts.wholeword) ? '' : '($|\\W:?)';
							txt = txt.replace(/(^\*|\*$)/g,'');
							//escape special regexp chars
							txt = txt.replace(/([\(\)\+\*\?\:\[\]])/g,"\\$1");
							//concats spaces
							txt = txt.replace(/\s+/g,'\\s+');
							node.rex = new RegExp(
								ltrunc+txt+rtrunc,
								'm'+(opts.sensitive?'':'i')+(opts.matches?'g':'')
							);
						}
						if(src) node.src = src;
						if(root) {
							if(!mode) mode = opts.dftbool;
							if(mode===root.bool && not===(root.not||false)) 
								root.subs.push(node);
							else
								root = { bool: mode, subs: [ root, node ] };
						} else
							root = node;
						mode = false;
					};

				while( n < len ) {
					if( qry[n] == '"' ) {        //PARSE QUOTES
						o = n++;
						t = '';
						while( n < len && qry[n] != '"' ) t += qry[n++];
						if( n >= len ) return {error:'unbalanced quotes',pos:o+offset};
						add_branch({ text: t });
						n++;
					} else if( qry[n] == ')' ) { //PARSE PARENTHESIS
						return {error:'unbalanced parenthesis',pos:o+offset};
					} else if( qry[n] == '(' ) {
						o = n++;
						p = 1;
						t = '';
						while( n < len ){
							if( qry[n] == ')' && --p == 0 ) break;
							if( qry[n] == '(' ) p++;
							t += qry[n];
							if( qry[n] == '"' ) {
								q = n++;
								while( n < len && qry[n] != '"') t += qry[n++];
								t += qry[n];
								if( n >= len ) return {error:'unbalanced quotes',pos:q+offset};
							}
							n++;
						}
						if( n >= len ) return {error:'unbalanced parenthesis',pos:o+offset};
						var b = parse_branch( t, o+1, opts );
						if(b.error) return b;
						add_branch(b,t);
						n++;
					} else if( qry[n] <= ' ' ) { //SKIP SPACES
						while( n < len && qry[n] <= ' ') n++;
					} else if( qry[n] == '+' ) { //AND
						if( not || mode ) return {error:'unexpected operator',pos:n+offset};
						mode = 'AND';
						op = n++;
					} else if( qry[n] == '|' ) { //OR
						if( not || mode ) return {error:'unexpected operator',pos:n+offset};
						mode = 'OR';
						op = n++;
					} else if( qry[n] == '-' || qry[n] == '!' ) { //NOT
						not = !not;
						op = n++;
					} else {                    //PARSE WORD
						o = n;
						t = '';
						while( n < len && qry[n] > ' ' && !/[\(\)\+\-\|\!]/.test(qry[n]) ) t += qry[n++];
						if( /^(AND|OR|NOT|NEAR\d)$/i.test(t) ) { //booleans
							op = o;
							var b = RegExp.$1.toUpperCase();
							if( b == 'NOT' ) {
								not = !not;
							} else if( not || mode ) {
								return {error:'unexpected operator',pos:o+offset};
							} else {
								mode = b;
							}
						} else
							add_branch({ text:t });
					}
				}
				if( not || mode ) return {error:'unexpected operator',pos:op+offset};
				return root ? root : {error:'empty query',pos:offset};
			};
			this.error = 
			this.tree  = false;
			this.query = this.opts.unaccent ? unaccent(q) : q;
			var b = parse_branch( this.query, 0, this.opts );
			if( b.error ){
				this.error = b.error;
				if(this.opts.debug) console.log(b.error,'at',b.pos);
			} else {
				this.tree = b;
				if(this.opts.debug) console.log(this.dump());
			} 
			return this;
		},
		dump: function(node,ind){
			if(!this.tree) return '';
			if(!node) node = this.tree;
			if(!ind) ind = '';
			var
				not = node.not ? 'NOT ' : '',
				src = node.src ? ' : '+not+'('+node.src+')' : '',
				hit = node.match!=undefined ? ' = '+node.match : '';
				self = this;
			return node.bool
				? ind+not+node.bool+hit+src+"\n"+node.subs.map(function(n){ return self.dump(n,ind+' | ') }).join("\n")
				: ind+not+'"'+node.text+'"'+hit;
		},
		normalize: function(node){
			if(!node) node = this.tree;
			if(!node) return '';
			var
				not = node.not ? 'NOT ' : '',
				lst = [],
				self = this;
			if( node.bool ) {
				node.subs.forEach(function(n){ lst.push(self.normalize(n)) });
				return (not || node != this.tree)
					? not+'('+lst.join(' '+node.bool)+')'
					: lst.join(' '+node.bool);
			}
			return /\s/.test(node.text)
				? not+'"'+node.text+'"'
				: not+node.text;
		},
		match: function(txt){
			if(!this.tree) return false;
			var
				self = this, 
				reset_node = function(node){
					delete node.match;
					if( node.bool )
						node.subs.forEach(function(n){ reset_node(n) });
				},
				node_match = function(node, text, matches){
					var ok, i, w, p, l;
					if( node.bool ) {
						if(node.bool == 'AND')
							for(ok=true,i=0;i<node.subs.length && ok;++i)
								ok = node_match(node.subs[i],text,matches);
						else
							for(ok=false,i=0;i<node.subs.length;++i){
								ok = node_match(node.subs[i],text,matches) || ok;
								if(ok && !matches) break;
							}
					} else if( matches!==false && !node.not ) {
						ok = false;
						while((i = node.rex.exec(text)) != null){
							ok = true;
							w = i[0];
							p = i.index;
							if( !self.opts.sensitive )
								w = w.toLowerCase();
							if( self.opts.wholeword ){
								l = w.length;
								w = w.replace(/^\W+|\W+$/g,'');
								p += (l-w.length);
							}
							if(matches[w]==undefined) matches[w] = [];
							matches[w].push(p);
						}
					} else
						ok = node.rex.test( text );
					if(node.not) ok = !ok;
					node.match = ok;
					return ok;
				},
				ok,
				matches = this.opts.matches ? {} : false;
			reset_node( this.tree );
			ok = node_match( this.tree, this.opts.unaccent ? unaccent(txt) : txt, matches );
			if(this.opts.debug) {
				console.log(this.dump());
				if(matches) console.log(matches);
			}
			return this.opts.matches && ok ? matches : ok;
		}
	};
	if(o){
		if(typeof(o)=='string')
			qt.parse(o);
		else if(typeof(o)=='object') {
			['debug','sensitive','wholeword','unaccent','matches'].forEach(function(n){
				if(o[n]!==undefined) qt.opts[n]=o[n];
			});
			if(o.query) qt.parse(o.query);
		}
	}
	return qt;
});
