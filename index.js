const Nbrite = require('nbrite');
const express = require('express');
const rp = require('request-promise');

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

const finWinnerWithTrustedRandom = (attendees, nbWinner) => {
  return rp(`https://www.random.org/integers/?num=${nbWinner}&min=0&max=${attendees.length}&col=1&base=10&format=plain&rnd=new`)
      .then(function (body) {
       console.log(body);
        return body.split("\n")
                  .filter((element)=>{return element.length > 0})
                  .map(Number)
                  .map((index)=> { return attendees[index]})
      })
}


const app = express();


app.get('/:eventId/:nbWinners', function(req, res){
  getAttendees(req.params.eventId)
    .then(attendees => finWinnerWithTrustedRandom(attendees, req.params.nbWinners))
    .then(winners => winners.map(({profile: {first_name: first_name, last_name: last_name}}) => { return {'Winner': `${first_name} ${last_name}`}}))
    .then(winners => res.send(winners))
});

app.listen(3000);
