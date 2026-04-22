// Importeer het npm package Express (uit de door npm aangemaakte node_modules map)
// Deze package is geïnstalleerd via `npm install`, en staat als 'dependency' in package.json
import express from 'express'

// Importeer de Liquid package (ook als dependency via npm geïnstalleerd)
import { Liquid } from 'liquidjs';

// Maak een nieuwe Express applicatie aan, waarin we de server configureren
const app = express()

// Maak werken met data uit formulieren iets prettiger
app.use(express.urlencoded({extended: true}))

// Gebruik de map 'public' voor statische bestanden (resources zoals CSS, JavaScript, afbeeldingen en fonts)
// Bestanden in deze map kunnen dus door de browser gebruikt worden
app.use(express.static('public'))

// Stel Liquid in als 'view engine'
const engine = new Liquid()
app.engine('liquid', engine.express())

// Stel de map met Liquid templates in
// Let op: de browser kan deze bestanden niet rechtstreeks laden (zoals voorheen met HTML bestanden)
app.set('views', './views')


// GET ROUTES 
// Homepage
app.get('/', async function (request, response) {
   // Render index.liquid uit de Views map
   // Geef hier eventueel data aan mee
  const newsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_news')
  const newsData = await newsResponse.json()

  const zonesResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_zones')
  const zonesData = await zonesResponse.json()

  const plantsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_plants')
  const plantsData = await plantsResponse.json()

  response.render('index.liquid', {
    news: newsData.data,
    zones: zonesData.data,
    plants: plantsData.data
  })
})

//news page
app.get('/nieuws', async function (request, response) {

  const newsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_news')
  const newsData = await newsResponse.json()

  response.render('nieuws.liquid', {
    news: newsData.data
  })

})

app.get('/nieuws/:slug', async function (request, response) {

  const newsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_news')
  const newsData = await newsResponse.json()

  const article = newsData.data.find(function(item){
    return item.slug === request.params.slug
  })

  // Haal comments op gefilterd op dit artikel
  const commentsResponse = await fetch(
    `https://fdnd-agency.directus.app/items/frankendael_news_comments?filter[news][_eq]=${article.id}`
  )
  const commentsData = await commentsResponse.json()

  // Likes ophalen
  const likesResponse = await fetch(
    `https://fdnd-agency.directus.app/items/frankendael_news_likes?filter[news][_eq]=${article.id}`
  )
  const likesData = await likesResponse.json()

  response.render('news-detail.liquid', {
    article: article,
    comments: commentsData.data,
    likes: likesData.data,
    liked: request.query.liked,
    commented: request.query.success,
    error: request.query.error
  })

})

app.get('/collectie', async function (request, response) {
  const plantsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_plants')
  const plantsData = await plantsResponse.json()

  response.render('collectie.liquid', {
    plants: plantsData.data
  })
})

// IN DE BLOEI
app.get('/collectie/in-de-bloei', async function (request, response) {
  const plantsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_plants')
  const plantsData = await plantsResponse.json()

  // filter: alleen planten MET image (in bloom)
  const filteredPlants = plantsData.data.filter(function(plant){
    return plant.in_bloom !== null
  })

  response.render('in-de-bloei.liquid', {
    plants: filteredPlants
  })
})


// NA DE BLOEI
app.get('/collectie/na-de-bloei', async function (request, response) {
  const plantsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_plants')
  const plantsData = await plantsResponse.json()

  // filter: planten ZONDER image
  const filteredPlants = plantsData.data.filter(function(plant){
    return plant.in_bloom === null
  })

  response.render('na-de-bloei.liquid', {
    plants: filteredPlants
  })
})

// VOOR INFO KAART
app.get('/collectie/:slug', async function (request, response) {
  const plantsResponse = await fetch('https://fdnd-agency.directus.app/items/frankendael_plants')
  const plantsData = await plantsResponse.json()

  const plant = plantsData.data.find(function(item) {
    return item.slug === request.params.slug
  })

  response.render('plant-detail.liquid', {
    plant: plant
  })
})


//POST VOOR COMMENTS!!
app.post('/nieuws/:slug', async function (request, response) {
  try {
    const result = await fetch('https://fdnd-agency.directus.app/items/frankendael_news_comments', {
    method: 'POST',
    body: JSON.stringify({
      news: request.body.news,
      name: request.body.name,
      comment: request.body.comment
    }),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
  
// error als het niet goed gaat bij comment
  if (!result.ok) {
      return response.redirect(303, `/nieuws/${request.params.slug}?error=true`)
    }
    
    // als het wel is goed gelukt
    response.redirect(303, `/nieuws/${request.params.slug}?success=true`)
    
   } // als het fetchen niet goed gaat
    catch(e) {
    response.redirect(303, `/nieuws/${request.params.slug}?error=true`)
   }
})

// POST voor likes
app.post('/nieuws/:slug/like', async function (request, response) {
  try {
    const result = await fetch('https://fdnd-agency.directus.app/items/frankendael_news_likes', {
    method: 'POST',
    body: JSON.stringify({
      news: request.body.news
    }),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
  
  if (!result.ok) {
    return response.redirect(303, `/nieuws/${request.params.slug}?error=true`)
  }
 

  response.redirect(303, `/nieuws/${request.params.slug}?liked=true`)
  
} catch(e) {
    response.redirect(303, `/nieuws/${request.params.slug}?error=true`)
  }
})

// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000; als deze applicatie ergens gehost wordt, waarschijnlijk poort 80
app.set('port', process.env.PORT || 8000)

// Start Express op, gebruik daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console
   console.log(`Application started on http://localhost:${app.get('port')}`)
})
