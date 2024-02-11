import { useState } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    city: "",
    genre: "",
    time: "", 
    slot: 6,
    ageOver18: false,
  });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  console.log(formData);
  const [selectedGenre, setSelectedGenre] = useState("");
  const handleImageSubmit = () => {
    if (files.length > 0 && files.length + formData.imageUrls.length <= 3) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError("Image upload failed (2 MB max per image)");
          setUploading(false);
        });
    } else {
      setImageUploadError("You can only upload up to 3 images per event");
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, `images/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const genreOptions = [
    "Cooperative games",
    "Role-playing game",
    "Board games",
    "Dexterity",
    "Card games",
    "Chess",
    "Dice games",
    "Drafting",
    "Eurogame",
    "Wargame",
    "Worker placement",
    "Area control",
  ];

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
    setFormData({ ...formData, genre: event.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formData.imageUrls.length === 0) {
        return setError("You need to upload at least one image");
      }

      setLoading(true);
      setError(false);
      const res = await fetch("/api/listing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });

      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;

    if (e.target.id === "time") {
      const formattedTime = value.replace(" ", "T");
      setFormData({ ...formData, [e.target.id]: formattedTime });
    } else {
      setFormData({ ...formData, [e.target.id]: value });
    }

    if (e.target.id === "slot") {
      if (e.target.value < 6) {
        setFormData({ ...formData, slot: 6 });
      }
    }

    if (e.target.id === "ageOver18") {
      setFormData({ ...formData, ageOver18: e.target.checked });
    }
  };

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Create an Event
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Name"
            className="border p-3 rounded-lg"
            id="name"
            maxLength="32"
            minLength="1"
            required
            onChange={handleChange}
            value={formData.name}
          />
          <input
            type="text"
            placeholder="City"
            className="border p-3 rounded-lg"
            id="city"
            maxLength="32"
            minLength="1"
            required
            onChange={handleChange}
            value={formData.city}
          />
          <textarea
            type="text"
            placeholder="Description"
            className="border p-3 rounded-lg"
            id="description"
            required
            onChange={handleChange}
            value={formData.description}
          />
          <input
            type="text"
            placeholder="Address"
            className="border p-3 rounded-lg"
            id="address"
            required
            onChange={handleChange}
            value={formData.address}
          />
          <input
            type="datetime-local" 
            placeholder="Time"
            className="border p-3 rounded-lg"
            id="time"
            required
            onChange={handleChange}
            value={formData.time}
          />

          <div className="flex gap-6 flex-wrap">
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="ageOver18"
                className="w-5"
                onChange={handleChange}
                value={formData.ageOver18}
              />
              <span>Age over 18</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="slot"
              min="6"
              required
              className="p-3 border border-color-gray-500 rounded-lg"
              onChange={handleChange}
              value={formData.slot}
            />
            <p>Player slots</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="genre" className="font-semibold">
              Genre:
            </label>
            <select
              id="genre"
              value={selectedGenre}
              onChange={handleGenreChange}
              className="border p-3 rounded-lg"
              required
            >
              <option value="">Select Genre</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold">
            Images:
            <span className="font-normal text-gray-500 ml-2">
              The first image will be the cover image (max 3)
            </span>
          </p>
          <div className="flexe gap-4">
            <input
              onChange={(e) => setFiles(e.target.files)}
              className="p-3 border border-gray-400 rounded w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              type="button"
              disabled={uploading}
              onClick={handleImageSubmit}
              className="p-3 text-green-600 border border-green-600 rounded-lg uppercase hover:shadow-lg disabled:opacity-80 my-5"
            >
              {uploading ? "Uploading in progress" : "Upload"}
            </button>
          </div>
          <p className="text-red-600">{imageUploadError && imageUploadError}</p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between p-3 border items-center"
              >
                <img
                  src={url}
                  alt="listing image"
                  className="w-20 h-20 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75"
                >
                  Delete
                </button>
              </div>
            ))}
          <button className="p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80">
            {loading ? "Creating event" : "Create event"}
          </button>
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </form>
    </main>
  );
}
