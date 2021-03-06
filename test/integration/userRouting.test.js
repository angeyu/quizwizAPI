'use strict'
/* global it, describe, before */
const chai = require('chai')
let dirtyChai = require('dirty-chai')
const assert = require('chai').assert
const expect = require('chai').expect
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.use(dirtyChai)
const server = require('../../server/server')

// require the database models
const models = require('../../server/db/models')
const checkEmptyDatabase = require('../helper').checkEmptyDatabase
const quizQuery = require('../../server/queryAPI').quizQuery

const BASE_URL = '/api/v3/'
const title =
`
===============================
Integration Test '/user' routes
===============================
`

const user1 = {
  username: 'Alan',
  password: 'secret'
}
const quiz1 = {
  title: 'US History Testing Quiz',
  description: 'A quiz on the history of the United States',
  madeBy: 1
}
const userQuiz1 = {
  userId: 1,
  quizId: 1,
  score: 90
}

describe(title, () => {
  before(() => {
    return models.sequelize.sync({ force: true })
    .then(() => {
      checkEmptyDatabase()
    })
    .then(() => {
    // 3. add data into other tables HERE
    })
  })

  it('should be an empty list of users @ GET "/user/all"', (done) => {
    chai.request(server)
      .get(BASE_URL + 'user/all')
      .end((err, res) => {
        expect(err).to.be.null()
        expect(res).to.have.status(200)
        assert.deepEqual(res.body, [])
        done()
      })
  })

  it('should be able to post a new user @ POST "/user/new"', (done) => {
    chai.request(server)
      .post(BASE_URL + 'user/new')
      .send(user1)
      .end((err, res) => {
        expect(err).to.be.null()
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('object')
        assert.isTrue(res.body.created, 'should have created a new user')
        // assert.isNotTrue(res.body.created, 'should have created a new user')
        expect(res.body.user.username).to.equal(user1.username)
        expect(res.body.user).to.include.keys([
          'id', 'username', 'updatedAt', 'createdAt'
        ])
        done()
      })
  })

  it('should not be able to POST @ "/user/take-quiz" without valid quiz', (done) => {
    chai.request(server)
      .post(BASE_URL + 'user/take-quiz')
      .send(userQuiz1)
      .end((err, res) => {
        expect(err).to.be.null()
        expect(res).to.have.status(200)
        // console.log(res.body)
        // console.log('==============')
        assert.deepEqual(res.body, {error: 'Error! Need a valid quiz'}, 'Should not be able to enter quiz without valid quiz')
        done()
      })
  })

  it('should be able to POST @ "/user/take-quiz" with valid quiz and user id', (done) => {
    quizQuery.createQuiz(quiz1).then((resultArray) => {
      const [quiz, created] = resultArray
      assert.isTrue(created)
      assert.isObject(quiz)
      // now that quiz is in database --> make request
      chai.request(server)
        .post(BASE_URL + 'user/take-quiz')
        .send(userQuiz1)
        .end((err, res) => {
          expect(err).to.be.null()
          expect(res).to.have.status(200)
          // console.log(res.body)
          // console.log('==============')
          // assert.deepEqual(res.body, {error: 'Error! Need a valid quiz'}, 'Should not be able to enter quiz without valid quiz')
          expect(res.body.id).to.equal(1)
          expect(res.body).to.include.keys([
            'id', 'userId', 'quizId', 'score', 'updatedAt', 'createdAt'
          ])
          done()
        })
    })
  })

  it('should be able to get a user @ "/user/id/:id"', (done) => {
    chai.request(server)
      .get(BASE_URL + 'user/id/1') // get first user
      .end((err, res) => {
        expect(err).to.be.null()
        expect(res).to.have.status(200)
        // console.log(res.body)
        // console.log(res.body[0].quiz)
        // console.log('============')
        // const test = JSON.parse(JSON.stringify(res.body))
        // console.log(test.userquizzes)
        // expect(res.body).to.be.an('object')
        expect(res.body).to.include.keys([
          'id', 'username', 'updatedAt', 'createdAt', 'userquizzes', 'votes'
        ])
        done()
      })
  })

  it('should be not be able to get a user @ "/user/id/-2"', (done) => {
    chai.request(server)
      .get(BASE_URL + 'user/id/-2') // get first user
      .end((err, res) => {
        expect(err).to.be.null()
        expect(res).to.have.status(200)
        expect(res.body).to.be.null()
        // console.log(res.body)
        // console.log('============')
        done()
      })
  })
})
