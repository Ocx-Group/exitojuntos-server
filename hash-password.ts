import * as bcrypt from 'bcrypt';

async function hashPassword() {
  const password = 'Exito123$';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedPassword);
  return hashedPassword;
}

void hashPassword();
