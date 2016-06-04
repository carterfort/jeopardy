<template>
    <div class="row">
        <div class="col-sm-3 text-center player-box" v-for="player in players">
            <h4>
                {{player.name}}<br/>
                <small>{{player.bank}}</small>
            </h4>
        </div>
    </div>
    <div class="row">
      <div class="col-sm-2" v-for="category in categories">
        <div class="category-container">
            <div class="blue-box">
              <h5>{{category.title}}</h5>
            </div>
            <div class="clue-container" 
                v-for="clue in category.clues | orderBy 'value'"  
                v-bind:class="{'blue-box' : ! clue.answered, 'grey-box' : clue.answered}"
                @click="askQuestionForClue(clue)"
            >
                <template v-if="clue.answered">
                    <h5><s>${{clue.value}}</s></h5>
                </template>
                <template v-else>
                    <h5  >${{clue.value}}</h5>
                </template>
            </div>
        </div>
      </div>
    </div>
    <div class="modal fade" id="clue-modal" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" v-if="currentClue">{{currentClue.category.title}} for ${{currentClue.value}}</h4>
                </div>
                <div class="modal-body">
                    <p v-if="gameState.displayQuestion">{{ currentQuestionDisplay }}</p>
                    <p v-if="gameState.displayAnswer"><em v-html="currentClue.answer"></em></p>
                    </div>
                <div class="modal-footer">
                    <template v-if="gameState.displayQuestionTimer">
                        {{questionTimerTimeRemaining}}
                    </template>
                    <template v-if="gameState.displayScoreButtons">
                        <div class="btn-group">
                            <button class="btn btn-success" @click="playerWasCorrect()">
                                {{playerThatPressedBuzzer.name}} was correct!
                            </button>
                            <button class="btn btn-default" @click="playerWasIncorrect()">
                                <span class="text-danger">
                                    {{playerThatPressedBuzzer.name}} was incorrect :(
                                </span>
                            </button>
                        </div>
                    </template>
                    <template v-else>
                    <button v-for="player in players" @click="buzzerPressed(player)" type="button" class="btn btn-primary">{{player.name}}</button>
                    </template>
                    
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->
</template>

<script>

import {GameState} from '../classes/GameState.js';
import {Player} from '../classes/Player.js';

let gameBoardState = new GameState(0, 0, 0, 0)
let questionAskedState = new GameState(1, 0, 0, 0)
let buzzerPressed = new GameState(1, 0, 0, 1)
let timesUp = new GameState(1, 1, 1, 0)

let playerOne = new Player('Carter', 1)
let playerTwo = new Player('Christina', 2)

export default {
  data () {
    return {
      categories : [],
      currentClue : '',
      currentAnswer: '',
      readingAnswerTimers : [],
      gameState : gameBoardState,
      questionTimer : false,
      questionTimerTimeRemaining: 5,
      currentQuestionDisplay : '',
      players : [playerOne, playerTwo],
      playerThatPressedBuzzer : false
    }
  },
  ready () {
    
    this.fetchAllCategories();

    $('#clue-modal').on('hidden.bs.modal', function (e) {
        this.currentClue = ''
        this.stopReadingAnswerTimers();
    }.bind(this))

    $(document).keyup(function(e){
        if (this.gameState = questionAskedState)
        {
            if (e.keyCode == 65){
                this.buzzerPressed(playerOne)
            } 

            if (e.keyCode == 186){
                this.buzzerPressed(playerTwo)
            }
        }
    }.bind(this))

  },
  methods : {
    fetchAllCategories() {
        var categoryIDs = this.randomCategories();
        categoryIDs.forEach( function(id){
            this.fetchCategoryWithID(id);
        }.bind(this))
    },
    fetchCategoryWithID(id) {
        var vm = this;

        vm.$http({url: 'http://jservice.io/api/categories?count=1&offset='+id, method: 'GET'}).then(function (response) {
            var category = response.data[0];
            if (category) {
                category.clues = [];
                vm.categories.push(category);
                vm.fetchCluesForCategory(category);
            }
      }, function (response) {
          // error callback
      });
    },
    randomCategories() {
        var numbers = [];
        
        var failsafe = 0;

        while(numbers.length < 6 && failsafe < 10){
            failsafe++;
            var randomNumber = Math.ceil(Math.random()*400) + 1;

            if (numbers.filter( number => { return number == randomNumber} ).length == 0) {
                numbers.push(randomNumber);
            }
        }

        return numbers;
    },
    fetchCluesForCategory(category){
        var vm = this;

        var values = [200, 400, 600, 800, 1000]

        values.forEach(function(value){
            var url = "http://jservice.io/api/clues?category="+category.id+"&value="+value
            vm.$http.get(url).then(function(response){
                var clue = response.data[0]
                if (clue)
                {
                    clue.category = category;
                    clue.answered = false
                    category.clues.push(clue)
                }
            })
        });
    },
    askQuestionForClue (clue)
    {
        if(clue.answered) { return }

        this.gameState = questionAskedState
        this.currentClue = clue
        this.readOutAnswer();
        $('#clue-modal').modal({show : true});
    },
    backToTheGame() {
        this.gameState = gameBoardState
        this.currentClue = false;
        this.currentQuestionDisplay = ''
        this.playerThatPressedBuzzer = false;
        $('#clue-modal').modal('hide');
    },
    readOutAnswer(){
        var words = this.currentClue.question.split("");
        this.readingAnswerOkay = true
        for (var i = 0; i < words.length; i++)
        {
            var timer = setTimeout(function(){
                this.currentQuestionDisplay += words.shift()
            }.bind(this), 100 * i)
            this.readingAnswerTimers.push(timer);
        }
    },
    stopReadingAnswerTimers()
    {
        this.readingAnswerTimers.forEach(function(timer){
            clearTimeout(timer);
        });
        this.readingAnswerTimers = []
    },
    buzzerPressed (player){
        this.playerThatPressedBuzzer = player
        this.gameState = buzzerPressed
        this.stopReadingAnswerTimers();
        this.currentQuestionDisplay = this.currentClue.question
        this.startQuestionTimer()
    },
    playerWasCorrect(){
        this.playerThatPressedBuzzer.addMoney(this.currentClue.value)
        this.currentClue.answered = true;
        this.backToTheGame()
    },
    playerWasIncorrect(){
        this.playerThatPressedBuzzer.loseMoney(this.currentClue.value)
        this.currentClue.answered = true;
        this.backToTheGame()
    },

    startQuestionTimer () {

        if (this.questionTimerTimeRemaining <= 0){
            clearTimeout(this.questionTimer)
            this.questionTimer = false
            this.gameState = timesUp;
            this.questionTimerTimeRemaining = 5
        } else {
            this.questionTimer = setTimeout(function(){
                this.questionTimerTimeRemaining -= 1
                this.startQuestionTimer()
            }.bind(this), 900)
        }
    }
  }
};
</script>

<style>

.player-box {
    border: 1px solid #aeaeae;
    margin-bottom: 1.2em;
    margin-top: 1.2em;
}

.blue-box {
    color:yellow;
    background: blue;
    padding:25px 10px;
    text-align: center;
    margin-bottom: 16px;
}

.grey-box {
    color:white;
    background: grey;
    padding:25px 10px;
    text-align: center;
    margin-bottom: 16px;
}

.clue-container {
    cursor: pointer;
}

</style>