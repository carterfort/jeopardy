<template>
    <div class="row">
      <div class="col-sm-2" v-for="category in categories">
        <div class="category-container">
            <div class="blue-box">
              <h5>{{category.title}}</h5>
            </div>
            <div class="clue-container blue-box" 
                v-for="clue in category.clues | orderBy 'value'"  
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
                    <p>{{ displayCurrentQuestion }}</p>
                    <p v-if="showCurrentAnswer"><em>{{currentClue.answer}}</em></p>
                    </div>
                <div class="modal-footer">
                    <template v-if="displayAccuracyControls">
                        <p>{{currentClue.answer}}</p>
                        <div class="btn-group">

                        </div>
                    </template>
                    <button v-else @click="guessTheAnswer()" type="button" class="btn btn-primary">I know! I know!</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->
</template>

<script>

class GameState {
    constructor(displayQuestion, displayTruthyFalsy, displayAnswer){
        this.displayAnswer = displayAnswer
        this.displayTruthyFalsy = displayTruthyFalsy
        this.displayQuestion = displayQuestion
    }
}

let gameBoardState = new GameState(0, 0, 0)
let questionAskedState = new GameState(1, 0, 0)
let buzzerPressed = new GameState(1, 1, 0)

export default {
  data () {
    return {
      categories : [],
      currentClue : '',
      currentAnswer: '',
      showCurrentAnswer : false,
      displayCurrentQuestion : '',
      readingAnswerTimers : [],
      displayAccuracyControls : false
    }
  },
  ready () {
    
    this.fetchAllCategories();

    $('#clue-modal').on('hidden.bs.modal', function (e) {
        this.currentClue = ''
        this.showCurrentAnswer = false;
        this.displayCurrentQuestion = ''
        this.stopTimers();
        this.displayAccuracyControls = false
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

        this.currentClue = clue
        this.readOutAnswer();
        $('#clue-modal').modal({show : true});
    },
    checkAnswer() {
        
        if (this.showCurrentAnswer) {
            this.backToTheGame();
        }
        this.showCurrentAnswer = true;
        this.currentClue.answered = true;
        
    },
    guessTheAnswer(){
        this.stopTimers();
        this.displayCurrentQuestion = this.currentClue.question;
        this.displayAccuracyControls = true
    },
    backToTheGame() {
        $('#clue-modal').modal('hide');
    },
    readOutAnswer(){
        var words = this.currentClue.question.split("");
        this.readingAnswerOkay = true
        for (var i = 0; i < words.length; i++)
        {
            var timer = setTimeout(function(){
                this.displayCurrentQuestion += words.shift()
            }.bind(this), 100 * i)
            this.readingAnswerTimers.push(timer);
        }
    },
    stopTimers()
    {
        this.readingAnswerTimers.forEach(function(timer){
            clearTimeout(timer);
        });
        this.readingAnswerTimers = []
    }
  }
};
</script>

<style>
.blue-box {
    color:yellow;
    background: blue;
    padding:25px 10px;
    text-align: center;
    margin-bottom: 16px;
}

.clue-container {
    cursor: pointer;
}

</style>