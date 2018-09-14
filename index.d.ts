declare function Raku2Zip(
  src: string | string[],
  dest: string,
  options: Raku2Zip.Options,
  cb: Raku2Zip.ProgressCallback
): Promise<Raku2Zip.ProgressData>;

declare function Raku2Zip(
  src: string | string[],
  dest: string,
  options: Raku2Zip.Options
): Promise<Raku2Zip.ProgressData>;

declare function Raku2Zip(
  src: string | string[],
  dest: string,
  cb: Raku2Zip.ProgressCallback
): Promise<Raku2Zip.ProgressData>;

declare function Raku2Zip(
  src: string | string[],
  dest: string
): Promise<Raku2Zip.ProgressData>;

declare namespace Raku2Zip {
  type Options = {
    cwd?: string;
    overwrite?: boolean;
  };

  type ProgressData = {
    path: string;
    completedSize: number;
    done: boolean;
  };

  type ProgressCallback = (data: ProgressData) => void;
}

export = Raku2Zip;
