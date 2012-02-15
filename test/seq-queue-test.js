var should = require('should');
var SeqQueue = require('../lib/seq-queue');

var queueName = 'test-queue';
var timeout = 1000;

describe('seq-queue', function() {
	
	describe('#createQueue', function() {
		it('should return a seq-queue instance with init properties', function() {
			var queue = SeqQueue.createQueue(queueName, timeout);
			should.exist(queue);
			queue.should.have.property('name', queueName);
			queue.should.have.property('timeout', timeout);
			queue.should.have.property('status', SeqQueue.IDLE);
		});
	});
	
	describe('#addTask' , function() {
		it('should change the queue status from idle to busy and invoke the task at once when task finish when queue idle', function(done) {
			var queue = SeqQueue.createQueue(queueName, timeout);
			queue.should.have.property('status', SeqQueue.IDLE);
			queue.addTask(function(task) {
				should.exist(task);
				task.done();
				queue.should.have.property('status', SeqQueue.IDLE);
				done();
			});
			queue.should.have.property('status', SeqQueue.BUSY);
		});
		
		it('should keep the status busy and keep the new task wait until the former tasks finish when queue busy', function(done) {
			var queue = SeqQueue.createQueue(queueName, timeout);
			var formerTaskFinished = false;
			queue.addTask(function(task) {
				formerTaskFinished = true;
				task.done();
			});
			queue.should.have.property('status', SeqQueue.BUSY);
			queue.addTask(function(task) {
				formerTaskFinished.should.be.true;
				queue.should.have.property('status', SeqQueue.BUSY);
				task.done();
				queue.should.have.property('status', SeqQueue.IDLE);
				done();
			});
			queue.should.have.property('status', SeqQueue.BUSY);
		});
	});
	
	describe('#close', function() {
		it('should not accept new request but should execute the rest task in queue when close gracefully', function(done) {
			var queue = SeqQueue.createQueue(queueName, timeout);
			var executedTaskCount = 0;
			queue.addTask(function(task) {
				executedTaskCount++;
				task.done();
			}).should.be.true;
			queue.close(false);
			queue.should.have.property('status', SeqQueue.CLOSED);
			
			queue.addTask(function(task) {
				// never should be executed
				executedTaskCount++;
				task.done();
			}).should.be.false;
			
			// wait all task finished
			setTimeout(function() {
				executedTaskCount.should.equal(1);
				done();
			}, 1000);
		});
	});
});