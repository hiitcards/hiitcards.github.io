import React, {Component} from 'react'
import {Container, Grid, Icon, Segment} from 'semantic-ui-react'
import _ from 'lodash'
import HiitCard from "./HiitCard"
import Cards from './Cards.json'
import JsonStore from "./JsonStore";

class HiitScheduler extends Component {

  beepA = new Audio('beep-a.mp3')
  beepB = new Audio('beep-b.mp3')

  state = {
    repetitionSeconds: 0,
    breakSeconds: 0,
    currentSecond: 0,
    repetitions: 0,
    repetitionIndex: 0,
    cardIndex: 0,
    isPaused: true,
    isBreak: false,
    shuffledCards: [],
    disabledCardIds: [],
    volume: 0
  }

  jsonStore = new JsonStore()

  componentWillMount() {
    this.setState({...this.jsonStore.get()})
  }

  componentDidMount() {
    this.order()
  }

  order() {
    const cards = _.clone(Cards)
    const ids = this.state.disabledCardIds
    _.remove(cards, (card) => {
      return _.includes(ids, card.id)
    })
    const orderedCards = _.orderBy(cards, card => card.order);
    this.setState({shuffledCards: orderedCards})
  }

  shuffle() {
    const cards = _.clone(Cards)
    const doubleCards = cards.concat(cards)
    const ids = this.state.disabledCardIds
    _.remove(doubleCards, (card) => {
      return _.includes(ids, card.id)
    })
    this.setState({shuffledCards: _.shuffle(doubleCards)})
  }

  isHalfWay() {
    let halfWaySeconds = Math.floor(this.state.repetitionSeconds / 2)
    return this.state.currentSecond === halfWaySeconds
  }

  remainingSeconds() {
    return this.state.repetitionSeconds - this.state.currentSecond
  }

  remainingRepetitions() {
    return this.state.repetitions - this.state.repetitionIndex
  }

  start() {
    this.doubleBeep(1)
    document.noSleep.enable()
    this.timerID = setInterval(
      () => this.tick(),
      1000
    )
    this.setState({isPaused: false})
  }

  pause() {
    clearInterval(this.timerID)
    this.setState({isPaused: true})
  }

  reset() {
    this.pause()
    this.setState({
      currentSecond: 0,
      repetitionIndex: 0
    })
  }

  end() {
    this.reset()
    this.doubleBeep(3)
  }

  beep(times) {
    this.beepA.volume = this.state.volume
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        this.beepA.play()
      }, i * 1000)
    }
  }

  doubleBeep(times) {
    this.beepA.volume = this.state.volume
    this.beepB.volume = this.state.volume
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        this.beepA.play()
        this.beepB.play()
      }, i * 1000)
    }
  }

  tick() {
    if (this.remainingRepetitions() <= 1 && this.remainingSeconds() <= 1)
      this.end()
    else if (this.remainingSeconds() <= 1)
      this.break()
    else {
      this.setState({
        currentSecond: this.state.currentSecond + 1
      })

      if (this.remainingSeconds() <= 3)
        this.beep(1)
    }
  }

  break() {
    clearInterval(this.timerID)
    this.setState({isBreak: true})

    setTimeout(() => this.endBreak(), (this.state.breakSeconds - 3) * 1000)
    this.timerID = setInterval(() => this.continue(), this.state.breakSeconds * 1000)

    this.beep(1)
    this.prepareNextRepetition()
  }

  endBreak() {
    this.beep(3)
    this.setState({isBreak: false})
  }

  continue() {
    this.beep(1)
    clearInterval(this.timerID)

    this.nextRepetition()
    this.timerID = setInterval(() => this.tick(), 1000)
  }

  prepareNextRepetition() {
    let nextCardIndex = this.state.cardIndex + 1
    if (nextCardIndex >= this.state.shuffledCards.length) {
      nextCardIndex = 0
    }

    this.setState({
      currentSecond: 0,
      repetitionIndex: this.state.repetitionIndex + 1,
      cardIndex: nextCardIndex
    })
  }

  nextRepetition() {
    this.beep(1)
  }

  // #### UI EVENTS

  handleClick = () => {
    if (this.state.isPaused)
      this.start()
    else
      this.pause()
  }

  onCardClick = () => {
    if (this.state.isPaused)
      this.order()
  }

  onBreakClick = () => {
    this.setState({isBreak: false})
    this.pause()
  }

  render() {
    const card = this.state.shuffledCards[this.state.cardIndex]

    if (card) {
      let cardBackground = 'green'
      if (this.state.isPaused)
        cardBackground = 'orange'

      let cardStyle = {
        padding: '10px',
        backgroundColor: cardBackground
      }

      return (
        <Container>
          <div className={this.state.isBreak ? 'hidden' : ''}>
            <div>
              <Grid>
                <Grid.Column>
                  <Grid.Row onClick={this.handleClick}>
                    <div style={cardStyle}>
                      <HiitCard
                        name={card.name}
                        description={card.description}
                        image={card.image}
                      >
                      </HiitCard>
                    </div>
                  </Grid.Row>
                  <Grid.Row>
                    <Segment basic>
                      <a href="/#/settings">
                        <h1>
                      <span className="white">
                        <Icon name='clock'/> {this.remainingRepetitions()}
                      </span>
                        </h1>
                      </a>
                    </Segment>
                  </Grid.Row>
                </Grid.Column>
              </Grid>
            </div>
          </div>
          <div className={!this.state.isBreak ? 'hidden' : ''}>
            <Icon className="massive orange time" onClick={this.onBreakClick}/>
            <p>Break</p>
          </div>
        </Container>
      )
    } else {
      return (
        <div>...</div>
      )
    }
  }
}

export default HiitScheduler