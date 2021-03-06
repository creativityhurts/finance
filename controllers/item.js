
/**
 * Module dependencies.
 */

var utils = require('../lib/helpers');

/**
 * Validate `obj`'s `prop`, with the given validation `type`.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {String} type
 */

function validate(obj, prop, type) {
  var val = obj[prop];
  switch (type || 'present') {
    case 'number':
      val = parseFloat(val);
      if (isNaN(val)) throw new Error(prop + ' must be a number');
      obj[prop] = val;
      break;
    case 'present':
      if (!val) throw new Error(prop + ' required');
      break;
    case 'date':
      validate(obj, prop, 'present');
      val = utils.parseDate(val);
      if (!(val instanceof Date)) throw new Error(prop + ' must be a date');
      if (isNaN(val.getTime())) throw new Error(prop + ' is an invalid date');
      obj[prop] = val;
      break;
  }
}

/**
 * Parse `tags` string, returning an array.
 *
 * @param {String} tags
 * @return {Array}
 */

function parseTags(tags) {
  return tags
    ? tags.split(/ *, */)
    : [];
}

/**
 * Respond with items.
 */

exports.index = function(req, res){
  var month = req.params.month
    , items = db.months[month].items;
  res.send(items);
};

/**
 * Create an item.
 */

exports.create = function(req, res, next){
  var month = req.params.month
    , items = db.months[month].items
    , item = req.body.item;

  item.tags = parseTags(item.tags);

  try {
    validate(item, 'entity');
    validate(item, 'date', 'date');
    validate(item, 'category');
    validate(item, 'amount', 'number');
    item.id = db.ids++;
    items[item.id] = item;
    db.save();
    res.partial('item', { month: month, object: item }, function(err, html){
      if (err) return next(err);
      res.send({ append: html, to: '#items' });
    });
  } catch (err) {
    res.send({ error: err.message });
  }
};

/**
 * Update an item.
 */

exports.update = function(req, res, next){
  var month = req.params.month
    , id = req.params.item
    , data = req.body.item[id]
    , item = db.months[month].items[id];

  try {
    validate(data, 'entity');
    validate(data, 'date', 'date');
    validate(data, 'category');
    validate(data, 'amount', 'number');
    for (var key in data) item[key] = data[key];
    item.tags = parseTags(item.tags);
    db.save();
    res.end();
  } catch (err) {
    res.send({ error: err.message });
  }
};

/**
 * Destroy an item.
 */

exports.destroy = function(req, res, next){
  var month = db.months[req.params.month]
    , id = req.params.item
    , item = month.items[id];
  if (!item) return res.send({ error: 'Cannot find item' });
  delete month.items[id];
  db.save();
  res.send({});
};