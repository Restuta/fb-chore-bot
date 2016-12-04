import utils from 'util'

const inspect = obj => utils.inspect(obj, {
  depth: 4,
  colors: true,
  maxArrayLength: 200,
  breakLength: 180
})

export {
  inspect
}
