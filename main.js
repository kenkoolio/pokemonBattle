var express = require('express');
var app = express();
var bp = require('body-parser');
var path = require('path');
var root = __dirname;
var http = require('http');

app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());
app.use(express.static(path.join(root, "./client")));

var game = {
  players: [],
  addPlayer: function(player){
    if (game.players.length < 2){
      game.players.push(player);
    }
  },
  clearPlayers: function(){
    for (var i=0, j=game.players.length; i<j; i++){
      game.players.pop();
    }
  }
};

function playerConstructor(name){
  var player = {};
  player.name = name;
  player.card = null;
  player.hand = [];
  player.addCard = function(card){
    if (player.hand.length < 1){
      player.hand.push(card);
    }
  player.clearHand = function(){
    player.hand = [];
  }

  };
  return player;
};


//routes
app.post('/getCard', function(req, res){
  // var poke_api = 'http://pokeapi.co/api/v1/pokemon/';
  var number = Math.floor(Math.random()*(152));

  var options = {
    host: 'pokeapi.co',
    path: '/api/v1/pokemon/'+number+'/'
  };

  var currentPlayer = game.players[req.body.currentTrainer];
  if (currentPlayer.hand.length > 0){
    currentPlayer.clearHand();
  }
  http.get(options, function(response){
    // console.log("RESULTS ", response);
    console.log("Status Code", response.statusCode);

    var firstBody = '';

    response.on('data', function(d){
      firstBody += d;
    })

    response.on('end', function(){
      // console.log(body);
      var parsed = JSON.parse(firstBody);

      var spriteURL = "http://pokeapi.co"+parsed.sprites[0].resource_uri;

      var spriteOptions = {
        host: 'pokeapi.co',
        path: parsed.sprites[0].resource_uri
      }

      //need to make another http request to get the sprite url
      http.get(spriteOptions, function(spriteResponse){
        // console.log(spriteResponse);

        var spriteBody = '';
        spriteResponse.on('data', function(h){
          spriteBody += h;
        })

        spriteResponse.on('end', function(){
          var spriteParsed = JSON.parse(spriteBody);
          // console.log(spriteParsed);

          var pokemonCard = {
            name      : parsed.name,
            pokedex   : parsed.pkdx_id,
            hp        : parsed.hp,
            abilities : [],
            attack    : parsed.attack,
            sp_atk    : parsed.sp_atk,
            defense   : parsed.defense,
            sp_def    : parsed.sp_def,
            sprite    : spriteParsed.image+'/',
            types     : []
          }

          for (var i=0; i<parsed.abilities.length; i++){
            pokemonCard.abilities.push(parsed.abilities[i].name);
          }

          for (var j=0; j<parsed.types.length; j++){
            pokemonCard.types.push(parsed.types[j].name);
          }

          // console.log(currentPlayer);
          currentPlayer.addCard(pokemonCard);

          res.json(currentPlayer);
        })

        spriteResponse.on('error', function(err){
          console.log("spriteMeeeh", err.message);
        });
      })

    })

    response.on('error', function(err){
      console.log("meeeh", err.message);
    });
  });
}); //post to get card

app.post('/create', function(req, res){
  console.log(req.body.name);
  if (req.body.name !== ''){
    if (game.players.length > 1){
      game.clearPlayers();
    }
    var playerName = req.body.name;
    var player = playerConstructor(playerName);
    game.addPlayer(player);
    res.json(game.players);
  } else {
    res.json({'Error':'Name cannot be blank'});
  }
});

app.get('/clear', function(req, res){
  game.clearPlayers();
  res.json({'Success': 'Yay'});
})

app.get('/players', function(req, res){
  res.json(game.players);
})

app.listen(5000, function(){
  console.log('Listening on port 5000');
})
