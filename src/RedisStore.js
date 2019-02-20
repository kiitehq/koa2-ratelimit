/**
 * RedisStore
 *
 * RedisStore for koa2-ratelimit
 *
 * @author Ashok Vishwakarma <akvlko@gmail.com>
 */

/**
 * Store
 *
 * Existing Store class
 */
const Store = require('./Store.js');

/**
 * redis
 *
 * promise-redis module
 * https://github.com/maxbrieiev/promise-redis#readme
 */
const redis = require('promise-redis')();

/**
 * RedisStore
 *
 * Class RedisStore
 */
class RedisStore extends Store {
  /**
   * constructor
   * @param {*} config
   *
   * config is redis config
   */
  constructor(config){
    super();
    this.client = redis.createClient(config);
  }

  /**
   * _hit
   * @access private
   * @param {*} key
   * @param {*} options
   * @param {*} weight
   */
  async _hit(key, options, weight) {
    let [counter, pttl] = await this.client.multi().get(key).pttl(key).exec();
    let dateEnd = Date.now();

    if(counter === null) {
      counter = weight;
      dateEnd = Date.now() + options.interval;
      await this.client.psetex(key, options.interval, counter);
    }else {
      dateEnd += pttl;
      counter = await this.client.incrby(key, weight);
    }

    return {
      counter,
      dateEnd
    }
  }

  /**
   * incr
   *
   * Override incr method from Store class
   * @param {*} key
   * @param {*} options
   * @param {*} weight
   */
  async incr(key, options, weight) {
    return await this._hit(key, options, weight);
  }

  /**
   * decrement
   *
   * Override decrement method from Store class
   * @param {*} key
   * @param {*} options
   * @param {*} weight
   */
  async decrement(key, options, weight) {
    await this.client.decrby(key, weight);
  }

  /**
   * saveAbuse
   *
   * Override saveAbuse method from Store class
   */
  saveAbuse() {}
}

module.exports = RedisStore;
