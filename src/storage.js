/*
Storage module for bots.

Supports storage of data on a team-by-team, user-by-user, and chnnel-by-channel basis.

save can be used to store arbitrary object.
These objects must include an id by which they can be looked up.
It is recommended to use the team/user/channel id for this purpose.
Example usage of save:
controller.storage.teams.save({id: message.team, foo:"bar"}, function(err){
  if (err)
    console.log(err)
});

get looks up an object by id.
Example usage of get:
controller.storage.teams.get(message.team, function(err, team_data){
  if (err)
    console.log(err)
  else
    console.log(team_data)
});
*/


//in-memory store
class Store {
  constructor(name) {
    // super(...arguments)

    this.name = name
    this._items = {}
  }

  get(id) {
    return this._items[id]
  }

  save(id, data) {
    this._items[id] = data
  }

  delete(id) {
    this._items[id] = undefined
  }

  all() {
    return Object.keys(this._items).map(key => this._items[key])
  }
}

export default function(config) {

  var teamsDb = new Store('teams');
  var usersDb = new Store('users');
  var channelsDb = new Store('channels');

  var storage = {
    teams: {
      get: teamId => teamsDb.get(teamId),
      save: teamData => teamsDb.save(teamData.id, teamData),
      delete: teamId => teamsDb.delete(teamId.id),
      all: () => teamsDb.all()
    },
    users: {
      get: userId => usersDb.get(userId),
      save: userData => usersDb.save(userData.id, userData),
      delete: userId => usersDb.delete(userId.id),
      all: () => usersDb.all()
    },
    channels: {
      get: channelId => channelsDb.get(channelId),
      save: channelData => channelsDb.save(channelData.id, channelData),
      delete: channelId => channelsDb.delete(channelId.id),
      all: () => channelsDb.all()
    }
  };

  return storage;
};
