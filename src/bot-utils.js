const Variations = function () {
  const variations = []


  const add = function(pattern, callback) {
    variations.push({
      pattern: pattern,
      callback: callback
    })
    return this
  }

  const addDefault = function(callback) {
    variations.push({
      default: true,
      callback: callback
    })

    return this
  }

  const get = () => variations

  return {
    add,
    addDefault,
    get
  }
}


export {
  Variations
}
