import express from "express";
import {
  allAnime,
  allAnimeMovie,
  allBatch,
  allGenres,
  animeSchedule,
  detailAnime,
  detailBatch,
  home,
  ongoingAnime,
  searchAnime,
  showEpisode,
  showGenre,
  showProducer,
  showSeason,
  showStudio,
} from "../controllers/anime.js";

const router = express.Router();

router.get("/home", home);

router.get("/anime", allAnime);
router.get("/anime/page/:page", allAnime);
router.get("/anime/:id", detailAnime);

router.get("/eps/:id", showEpisode);

router.get("/ongoing", ongoingAnime);
router.get("/ongoing/page/:page", ongoingAnime);

router.get("/schedule", animeSchedule);

router.get("/genres", allGenres);
router.get("/genres/:id", showGenre);
router.get("/genres/:id/page/:page", showGenre);

router.get("/batch", allBatch);
router.get("/batch/page/:page", allBatch);
router.get("/batch/:id", detailBatch);

router.get("/movie", allAnimeMovie);
router.get("/movie/page/:page", allAnimeMovie);

router.get("/search/:id", searchAnime);

router.get("/studio/:id", showStudio);
router.get("/studio/:id/page/:page", showStudio);

router.get("/producer/:id", showProducer);
router.get("/producer/:id/page/:page", showProducer);

router.get("/season/:id", showSeason);
router.get("/season/:id/page/:page", showSeason);

router.get("*", (req, res) => {
  res.status(404).send({
    message:
      "Please read the documentation at https://github.com/Hanivan/restAPI-Samehadaku",
  });
});

export default router;
