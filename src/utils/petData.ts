export const DOG_BREEDS = [
  "Afghan Hound", "Airedale Terrier", "Akita", "Alaskan Malamute", "American Bulldog", 
  "Beagle", "Belgian Malinois", "Bernese Mountain Dog", "Bichon Frise", "Border Collie", 
  "Boston Terrier", "Boxer", "Brittany", "Bulldog", "Cavalier King Charles Spaniel", 
  "Chihuahua", "Chow Chow", "Cocker Spaniel", "Dachshund", "Dalmatian", 
  "Doberman Pinscher", "French Bulldog", "German Shepherd", "Golden Retriever", 
  "Great Dane", "Havanese", "Irish Setter", "Jack Russell Terrier", "Labrador Retriever", 
  "Maltese", "Mastiff", "Miniature Schnauzer", "Newfoundland", "Papillon", 
  "Pekingese", "Pembroke Welsh Corgi", "Pomeranian", "Poodle", "Pug", 
  "Rhodesian Ridgeback", "Rottweiler", "Saint Bernard", "Samoyed", "Shar-Pei", 
  "Shiba Inu", "Shih Tzu", "Siberian Husky", "Staffordshire Bull Terrier", "Vizsla", 
  "Weimaraner", "Whippet", "Yorkshire Terrier", "Mixed Breed (Dog)", "Other (Dog)"
].sort();

export const CAT_BREEDS = [
  "Abyssinian", "American Shorthair", "Bengal", "Birman", "British Shorthair", 
  "Burmese", "Chartreux", "Cornish Rex", "Devon Rex", "Egyptian Mau", 
  "Exotic Shorthair", "Himalayan", "Japanese Bobtail", "Korat", "Maine Coon", 
  "Manx", "Munchkin", "Norwegian Forest Cat", "Ocicat", "Oriental", 
  "Persian", "Ragdoll", "Russian Blue", "Savannah", "Scottish Fold", 
  "Selkirk Rex", "Siamese", "Siberian", "Singapura", "Somali", 
  "Sphynx", "Tonkinese", "Turkish Angora", "Turkish Van", "Mixed Breed (Cat)", "Other (Cat)"
].sort();

export const calculateAge = (birthday: string) => {
  if (!birthday) return "N/A";
  const birthDate = new Date(birthday);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years === 0) return `${months} months`;
  return `${years}y ${months}m`;
};