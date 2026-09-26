const crypto = require('crypto');

class MemoryDocument {
  constructor(collection, data) {
    this._collection = collection;
    this._id = data._id || crypto.randomUUID();
    Object.assign(this, data, { _id: this._id });
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const cleanDoc = { ...this };
    delete cleanDoc._collection;
    this._collection.data.set(this._id.toString(), cleanDoc);
    return this;
  }

  toObject() {
    const clean = { ...this };
    delete clean._collection;
    return clean;
  }

  toJSON() {
    return this.toObject();
  }
}

class MemoryQuery {
  constructor(collection, query = {}) {
    this.collection = collection;
    this.query = query;
    this._sort = null;
    this._limit = null;
    this._skip = 0;
    this._selectFields = null;
    this._deselectFields = null;
  }

  sort(sortCriteria) {
    this._sort = sortCriteria;
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  skip(count) {
    this._skip = count;
    return this;
  }

  select(fields) {
    if (typeof fields === 'string') {
      const parts = fields.split(' ').filter(Boolean);
      parts.forEach(p => {
        if (p.startsWith('-')) {
          if (!this._deselectFields) this._deselectFields = [];
          this._deselectFields.push(p.slice(1));
        } else if (p.startsWith('+')) {
          // Include explicitly
        } else {
          if (!this._selectFields) this._selectFields = [];
          this._selectFields.push(p);
        }
      });
    }
    return this;
  }

  populate() {
    return this;
  }

  _matches(item, query) {
    for (const key of Object.keys(query)) {
      const val = query[key];
      if (key === '$or' && Array.isArray(val)) {
        const matchesAny = val.some(subQuery => this._matches(item, subQuery));
        if (!matchesAny) return false;
        continue;
      }

      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        if ('$ne' in val && item[key] === val.$ne) return false;
        if ('$in' in val && Array.isArray(val.$in) && !val.$in.includes(item[key])) return false;
        if ('$regex' in val) {
          const reg = new RegExp(val.$regex, val.$options || '');
          if (!reg.test(String(item[key] || ''))) return false;
        }
        if ('$gte' in val && !(item[key] >= val.$gte)) return false;
        if ('$lte' in val && !(item[key] <= val.$lte)) return false;
        if ('$gt' in val && !(item[key] > val.$gt)) return false;
        if ('$lt' in val && !(item[key] < val.$lt)) return false;
      } else {
        if (key === '_id') {
          if (String(item._id) !== String(val)) return false;
        } else if (item[key] !== val) {
          return false;
        }
      }
    }
    return true;
  }

  async exec() {
    let results = Array.from(this.collection.data.values()).filter(item => this._matches(item, this.query));

    if (this._sort) {
      const [field, direction] = typeof this._sort === 'object'
        ? Object.entries(this._sort)[0]
        : [this._sort.replace(/^-/, ''), this._sort.startsWith('-') ? -1 : 1];
      results.sort((a, b) => {
        if (a[field] < b[field]) return direction === -1 ? 1 : -1;
        if (a[field] > b[field]) return direction === -1 ? -1 : 1;
        return 0;
      });
    }

    if (this._skip) {
      results = results.slice(this._skip);
    }

    if (this._limit) {
      results = results.slice(0, this._limit);
    }

    return results.map(doc => {
      const copy = { ...doc };
      if (this._deselectFields) {
        this._deselectFields.forEach(f => delete copy[f]);
      }
      return new MemoryDocument(this.collection, copy);
    });
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.data = new Map();
  }

  find(query = {}) {
    return new MemoryQuery(this, query);
  }

  async findOne(query = {}) {
    const q = new MemoryQuery(this, query);
    const results = await q.limit(1).exec();
    return results[0] || null;
  }

  async findById(id) {
    const item = this.data.get(String(id));
    if (!item) return null;
    return new MemoryDocument(this, { ...item });
  }

  async create(data) {
    const docData = Array.isArray(data) ? data : [data];
    const created = docData.map(item => {
      const doc = new MemoryDocument(this, { ...item, _id: item._id || crypto.randomUUID() });
      const plain = { ...doc };
      delete plain._collection;
      this.data.set(doc._id.toString(), plain);
      return doc;
    });
    return Array.isArray(data) ? created : created[0];
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const existing = this.data.get(String(id));
    if (!existing) return null;

    let updatedData = { ...existing };
    if (update.$set) {
      Object.assign(updatedData, update.$set);
    } else {
      Object.assign(updatedData, update);
    }
    updatedData.updatedAt = new Date();
    this.data.set(String(id), updatedData);

    return new MemoryDocument(this, updatedData);
  }

  async updateOne(query, update) {
    const item = await this.findOne(query);
    if (!item) return { matchedCount: 0, modifiedCount: 0 };
    return this.findByIdAndUpdate(item._id, update);
  }

  async findByIdAndDelete(id) {
    const existing = this.data.get(String(id));
    if (!existing) return null;
    this.data.delete(String(id));
    return new MemoryDocument(this, existing);
  }

  async deleteMany(query = {}) {
    const items = await this.find(query).exec();
    items.forEach(item => this.data.delete(String(item._id)));
    return { deletedCount: items.length };
  }

  async countDocuments(query = {}) {
    const items = await this.find(query).exec();
    return items.length;
  }
}

class MemoryStore {
  constructor() {
    this.collections = new Map();
  }

  getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MemoryCollection(name));
    }
    return this.collections.get(name);
  }
}

const memoryStoreInstance = new MemoryStore();

module.exports = {
  memoryStore: memoryStoreInstance,
  MemoryCollection,
  MemoryDocument,
};
