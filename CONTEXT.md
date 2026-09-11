# Yantraloka

Platform payung arsip dan kustomisasi formula prompt generative AI berbasis taksonomi dengan substitusi argumen inline dan instant clean copy.

## Language

**Prompt**:
Entri teks instruksi untuk model AI yang dapat bersifat statis atau memiliki sekumpulan Argument.
_Avoid_: Template, item, post

**Argument**:
Bagian dinamis di dalam Prompt yang memiliki nama dan nilai bawaan, serta nilainya dapat diganti secara interaktif oleh pengguna.
_Avoid_: Variable, placeholder, parameter, slot

**Inline Token**:
Komponen UI interaktif berwujud input/chip yang berada langsung di sela-sela teks Prompt untuk menyunting nilai Argument.
_Avoid_: Form field, input box terpisah

**Rendered Prompt**:
Teks string murni hasil substitusi seluruh Argument dengan nilai pengguna terkini, siap disalin ke clipboard tanpa markup sintaks atau JSON.
_Avoid_: Output, compiled text, raw prompt

**Tag**:
Label taksonomi hasil proses pengayaan offline yang dilekatkan pada Prompt untuk kebutuhan pemfilteran.
_Avoid_: Kategori, label, keyword

**Taxonomy**:
Himpunan baku Tag yang telah ditentukan sebagai acuan klasifikasi agar hasil penandaan konsisten dan terhindar dari fragmentasi istilah.
_Avoid_: Taglist, category tree
**Argument State**:
Penyimpanan nilai reaktif di sisi klien yang disinkronkan ke seluruh Inline Token yang memiliki nama identik di dalam satu Prompt.
_Avoid_: Form value, input state

**Modal Viewer**:
Dialog overlay untuk menampilkan detail Prompt, menyunting Argument secara inline, dan menyalin Rendered Prompt ke clipboard.
_Avoid_: Detail page, popup, prompt drawer

**Media Preview**:
Frame visual dalam Modal Viewer atau halaman detail Prompt yang menampilkan aset gambar terpilih secara proporsional tanpa pemotongan (un-cropped).
_Avoid_: Thumbnail box, image box, picture preview

**Media Lightbox**:
Overlay layar penuh untuk inspeksi resolusi penuh aset gambar dengan navigasi antar-aset dan penutupan interaktif.
_Avoid_: Image previewer, image popup, zoom modal
