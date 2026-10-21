/*
  Midnight Study Room: standalone runtime
  ---------------------------------------
  Runs the room's .dc.html design file outside Claude.
  It reads the room's markup from <template id="room-template">, fills in the
  {{holes}}, repeats <sc-for> lists, shows/hides <sc-if> blocks, and wires up
  onClick / onChange / onSubmit / onKeyDown, using React (bundled in /vendor,
  so nothing is fetched from other sites).
  You don't need to edit this file.
*/
(function () {
  'use strict';
  var h = React.createElement;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var EVENTS = { onclick: 'onClick', onchange: 'onChange', onsubmit: 'onSubmit', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', oninput: 'onInput', onfocus: 'onFocus', onblur: 'onBlur', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', ondblclick: 'onDoubleClick' };
  var HTML_ATTRS = { 'class': 'className', 'for': 'htmlFor', maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete', inputmode: 'inputMode', tabindex: 'tabIndex', readonly: 'readOnly', autofocus: 'autoFocus', spellcheck: 'spellCheck', colspan: 'colSpan', rowspan: 'rowSpan', enterkeyhint: 'enterKeyHint' };
  var WHOLE = /^\{\{\s*([^{}]+?)\s*\}\}$/;
  var ANY = /\{\{\s*([^{}]+?)\s*\}\}/g;

  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    for (var i = scopes.length - 1; i >= 0; i--) {
      var sc = scopes[i];
      if (sc && Object.prototype.hasOwnProperty.call(sc, parts[0])) {
        var v = sc;
        for (var j = 0; j < parts.length; j++) { v = v == null ? undefined : v[parts[j]]; }
        return v;
      }
    }
    return undefined;
  }
  function interp(str, scopes) {
    return str.replace(ANY, function (m, p) { var v = lookup(p, scopes); return v == null ? '' : String(v); });
  }
  function camel(s) { return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }); }
  function parseStyle(str) {
    var out = {};
    str.split(';').forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 0) return;
      var k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim();
      if (!k || v === '') return;
      out[k.indexOf('--') === 0 ? k : camel(k)] = v;
    });
    return out;
  }
  function valueOf(raw, scopes) {
    var m = raw.match(WHOLE);
    if (m) return lookup(m[1], scopes);
    if (raw.indexOf('{{') >= 0) return interp(raw, scopes);
    return raw;
  }

  function buildList(nodes, scopes) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var r = buildNode(nodes[i], scopes, i);
      if (r !== undefined) out.push(r);
    }
    return out;
  }

  function buildNode(n, scopes, key) {
    if (n.nodeType === 3) return n.nodeValue.indexOf('{{') >= 0 ? interp(n.nodeValue, scopes) : n.nodeValue;
    if (n.nodeType !== 1) return undefined;
    var tag = n.localName;
    if (tag === 'helmet') return undefined;
    if (tag === 'sc-if') {
      var show = valueOf(n.getAttribute('value') || '', scopes);
      return show ? h.apply(null, [React.Fragment, { key: key }].concat(buildList(n.childNodes, scopes))) : null;
    }
    if (tag === 'sc-for') {
      var list = valueOf(n.getAttribute('list') || '', scopes);
      var as = n.getAttribute('as') || 'item';
      var kids = (Array.isArray(list) ? list : []).map(function (item, idx) {
        var scope = { $index: idx }; scope[as] = item;
        return h.apply(null, [React.Fragment, { key: idx }].concat(buildList(n.childNodes, scopes.concat([scope]))));
      });
      return h.apply(null, [React.Fragment, { key: key }].concat(kids));
    }
    var isSvg = n.namespaceURI === SVG_NS;
    var props = { key: key };
    for (var a = 0; a < n.attributes.length; a++) {
      var at = n.attributes[a], name = at.name;
      if (name.indexOf('hint-') === 0) continue;
      var val = valueOf(at.value, scopes);
      if (EVENTS[name]) { if (typeof val === 'function') props[EVENTS[name]] = val; continue; }
      if (name === 'style') { props.style = typeof val === 'string' ? parseStyle(val) : val; continue; }
      if (name.indexOf('aria-') === 0 || name.indexOf('data-') === 0) {
        if (val === undefined || val === null) continue;
        props[name] = typeof val === 'boolean' ? String(val) : val; continue;
      }
      if (isSvg) {
        if (name === 'class') props.className = val;
        else if (name === 'xlink:href') props.xlinkHref = val;
        else props[name.indexOf('-') > 0 ? camel(name) : name] = val;
        continue;
      }
      var mapped = HTML_ATTRS[name] || name;
      if (mapped === 'readOnly' || mapped === 'autoFocus' || mapped === 'disabled' || mapped === 'required' || mapped === 'multiple') { props[mapped] = val === '' ? true : !!val && val !== 'false'; continue; }
      if (mapped === 'checked') { props.checked = !!val && val !== 'false'; continue; }
      props[mapped] = val;
    }
    var children = (tag === 'input' || tag === 'textarea') ? [] : buildList(n.childNodes, scopes);
    return h.apply(null, [tag, props].concat(children));
  }

  var templateNodes = null;
  function nodes() {
    if (!templateNodes) {
      var t = document.getElementById('room-template');
      templateNodes = t ? t.content.childNodes : [];
    }
    return templateNodes;
  }

  class DCLogic extends React.Component {
    render() { return h.apply(null, [React.Fragment, null].concat(buildList(nodes(), [this.renderVals() || {}]))); }
  }
  window.DCLogic = DCLogic;
  window.DCRuntime = {
    mount: function (Component, el) {
      ReactDOM.createRoot(el).render(h(Component, {}));
    }
  };
})();
