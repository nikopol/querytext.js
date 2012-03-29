/*
querytext.js 0.1 (c) 2012 niko
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
  querytext({          // get an object object with a parsed query
  	sensisitive: true, //   and options setted
  	debug: true,
  	query: "query"
  })                 

methods:

  parse('query');    //return {error:"msg",pos:12} or the 
                     //querytext object
  normalize();       //return the normalized query as string
  match('text');     //return true if the text match the query
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

=========================================================================
LICENSE
=========================================================================

DO WHAT THE FUCK YOU WANT WITH
ESPECIALLY IF YOU OFFER ME A BEER
PUBLIC LICENSE
Version 1, Mars 2012
 
Copyright (C) 2012 - niko
 
Everyone is permitted to copy and distribute verbatim 
or modified copies of this license document, and 
changing it is allowed as long as the name is changed.

DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND 
MODIFICATION :
- You just DO WHAT THE FUCK YOU WANT.
*/

var querytext=(function(o){
	var qt = {
		sensitive: false,
		debug: false,
		error: false,
		query: false,
		tree:  false,
		parse: function(q){
			var parse_branch = function(qry, offset, sensitive){
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
							var ltrunc = txt[0] == '*' ? '' : '(^|\\W:?)';
							var rtrunc = txt.substr(-1) == '*' ? '' : '($|\\W:?)';
							//escape special regexp chars
							['(',')','+','*','?',':','[',']'].forEach(function(c){
								txt = txt.replace(c,'\\'+c);
							});
							//concats spaces
							txt = txt.replace(/\s+/g,'\\s+');
							node.rex = new RegExp(ltrunc+txt+rtrunc, sensitive ? 'm' : 'im');
						}
						if(src) node.src = src;
						root = root 
							? { bool: mode || 'OR', ope1: root, ope2: node }
							: node;
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
						var b = parse_branch( t, o+1, sensitive );
						if(b.error) return b;
						add_branch(b,t);
						n++;
					} else if( qry[n] == ' ' ) { //SKIP SPACES
						while( n < len && qry[n] == ' ') n++;
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
						while( n < len && !/[\(\)\s\+\-\|\!]/.test(qry[n]) ) t += qry[n++];
						if( /^(AND|OR|NOT)$/i.test(t) ) { //booleans
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
				return root;
			};
			this.error = 
			this.tree  = false;
			this.query = q;
			var b = parse_branch( q, 0, this.sensitive );
			if( b.error ){
				this.error = b;
				if(this.debug) console.log(b.error,'at',b.pos);
			} else {
				this.tree = b;
				if(this.debug) console.log(this.dump());
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
			return node.bool
				? ind+not+node.bool+hit+src+"\n"+
					this.dump(node.ope1,ind+' | ')+"\n"+
					this.dump(node.ope2,ind+' | ')
				: ind+not+'"'+node.text+'"'+hit;
		},
		normalize: function(node){
			if(!node) node = this.tree;
			if(!node) return '';
			var not = node.not ? 'NOT ' : '';
			if( node.bool ) {
				return (not || node != this.tree)
					? not+'('+this.normalize(node.ope1)+' '+node.bool+' '+this.normalize(node.ope2)+')'
					: this.normalize(node.ope1)+' '+node.bool+' '+this.normalize(node.ope2);
			}
			return /\s/.test(node.text)
				? not+'"'+node.text+'"'
				: not+node.text;
		},
		match: function(txt){
			if(!this.tree) return false;
			var 
				reset_node = function(node){
					delete node.match;
					if( node.bool ) {
						reset_node( node.ope1 );
						reset_node( node.ope2 );
					}
				},
				node_match = function(node, text){
					var ok = false;
					if( node.bool ) {
						ok = node.bool == 'AND'
							? node_match(node.ope1,text) && node_match(node.ope2,text)
							: node_match(node.ope1,text) || node_match(node.ope2,text);
						if(node.not) ok = !ok;
						node.match = ok;
					} else {
						ok = node.rex.test( text );
						if(node.not) ok = !ok;
						console.log((node.not?'NOT ':'')+node.text+' = '+ok);
						node.match = ok;
					}
					return ok;
				};
			reset_node( this.tree );
			var ok = node_match( this.tree, txt );
			if(this.debug) console.log(this.dump());
			return ok;
		}
	};
	if(o){
		if(typeof(o)=='string')
			qt.parse(o);
		else if(typeof(o)=="object") {
			['debug','sensitive'].forEach(function(n){
				if(o[n]) qt[n]=o[n];
			});
			if(o.query) qt.parse(o.query);
		}
	}
	return qt;
});
