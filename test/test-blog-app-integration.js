'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
  console.ing('seeding blog post data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    sedData.push(generateBlogPostData());
  }
  return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    }
  };
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('BlogPost API resource', function (){
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return all existing blog posts', function() {
      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res.body.blog_posts).to.have.lengthOf.at.least(1);
        return BlogPost.count();
      })
      .then(function(count) {
        expect(res.body.blog_posts).to.have.lengthOf(count);
      });
    });

    it('should return blog posts with right fields', function() {
      let resBlogPost;
      return chai.request(app)
      .get('/posts')
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.blog_posts).to.be.a('array');
        expect(res.body.blog_posts).to.have.lengthOf.at.least(1);

        res.body.blog_posts.forEach(function(blog_post) {
          expect(blog_post).to.be.a('object');
          expect(blog_post).to.include.keys(
            'id', 'title', 'content', 'author', 'publishDate');
        });
        resBlogPost = res.body.blog_posts[0];
        return BlogPost.findById(resBlogPost.id);
      })
      .then(function(blog_post){
        expect(resBlogPost.id).to.equal(blog_post.id);
        expect(resBlogPost.title).to.equal(blog_post.title);
        expect(resBlogPost.content).to.equal(blog_post.content);
        expect(resBlogPost.author).to.contain(blog_post.author.firstName);
        expect(resBlogPost.publishDate).to.equal(blog_post.publishDate);
      });
    });
  });

})

