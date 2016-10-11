const Nbrite = require('nbrite');
const express = require('express');

const nbrite = new Nbrite({'token': process.env.EVENTBRITE_TOKEN});

const range = (start, end) => {
  let pages = []
  for (var i = start ; i <= end; i++) {
     pages.push(i);
  }
  return pages
}

const getAttendees = (event_id) => {
    return nbrite.get(`/events/${event_id}/attendees`).then(attendees =>
      Promise.all(
        range(attendees.pagination.page_number +1, attendees.pagination.page_count)
          .reduce((acc, val) => acc.concat([nbrite.get(`/events/${event_id}/attendees`, { 'page': val }).then(data => data.attendees)]), attendees.attendees))
        .then(values => [].concat.apply([], values))
    )
}

const findWinner = (attendees, nbWinner) => {
  // Deception no immutable :'(
  let localAttendees = attendees.slice(0)
  const internalFindWinner = (acc, nbWinner) => {
    if (nbWinner == 0) {
      return acc
    }
    let winner = localAttendees.splice(Math.floor(Math.random()*localAttendees.length), 1)
    return internalFindWinner(acc.concat(winner), nbWinner - 1)
  }
  return internalFindWinner([], nbWinner)
}

const app = express();


app.get('/:eventId/:nbWinners', function(req, res){
  getAttendees(req.params.eventId)
    .then(attendees => findWinner(attendees, req.params.nbWinners))
    .then(winners => winners.map(({profile: {first_name: first_name, last_name: last_name}}) => { return {'Winner': `${first_name} ${last_name}`}}))
    .then(winners => res.send(winners))
});

app.listen(3000);
